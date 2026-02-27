<?php

namespace App\Http\Controllers;

use App\Models\Applicant;
use App\Models\JobPosting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use App\Mail\InterviewInvitation;
use App\Mail\RejectionEmail;
use App\Mail\OfferLetter;

class ApplicantController extends Controller
{
    /**
     * Display a listing of applicants for the tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Applicant::with([
            'jobPosting.requisition',
            'attachments',
            'interviews' => function ($q) {
                $q->latest();
            }
        ]);

        if (!$user->hasRole('admin')) {
            $query->where('tenant_id', $user->tenant_id);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('email', 'LIKE', "%{$search}%")
                    ->orWhere('phone', 'LIKE', "%{$search}%")
                    ->orWhere('professional_background', 'LIKE', "%{$search}%");
            });
        }

        if ($request->has('job_posting_id')) {
            $query->where('job_posting_id', $request->job_posting_id);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        } else {
            $query->where('status', '!=', 'hired');
        }

        $perPage = $request->input('per_page', 10);
        return response()->json($query->orderBy('created_at', 'desc')->paginate($perPage));
    }

    /**
     * Store a new applicant for a job posting.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'job_posting_id' => 'required|exists:job_postings,id',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:20',
            'resume_path' => 'nullable|string',
            'source' => 'nullable|string',
        ]);

        $jobPosting = JobPosting::findOrFail($request->job_posting_id);

        $applicant = Applicant::create([
            'tenant_id' => $jobPosting->tenant_id,
            'job_posting_id' => $request->job_posting_id,
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'resume_path' => $request->resume_path,
            'source' => $request->source ?? 'website',
            'status' => 'new',
        ]);

        return response()->json($applicant, 201);
    }

    /**
     * Update applicant status and add feedback.
     */
    public function updateStatus(string $id, Request $request): JsonResponse
    {
        $request->validate([
            'status' => 'required|in:applied,phone_screen,interview,offer,hired,rejected',
            'feedback' => 'nullable|string',
            'offered_salary' => 'nullable|string|max:100',
            'start_date' => 'nullable|string|max:100',
            'offer_notes' => 'nullable|string|max:1000',
            'rejection_note' => 'nullable|string|max:1000',
        ]);

        $applicant = Applicant::where('id', $id)
            ->where('tenant_id', $request->user()->tenant_id)
            ->firstOrFail();

        $feedback = $applicant->feedback ?? [];
        if ($request->feedback) {
            $feedback[] = [
                'user' => $request->user()->name,
                'note' => $request->feedback,
                'date' => now()->toDateTimeString(),
            ];
        }

        $oldStatus = $applicant->status;

        $updateData = [
            'status' => $request->status,
            'feedback' => $feedback,
        ];
        if ($request->offered_salary) {
            $updateData['offered_salary'] = $request->offered_salary;
        }
        if ($request->start_date) {
            $updateData['start_date'] = $request->start_date;
        }

        $applicant->update($updateData);

        // Send professional emails based on status change
        if ($request->status !== $oldStatus) {
            if ($request->status === 'interview') {
                Mail::to($applicant->email)->send(new InterviewInvitation($applicant, $applicant->jobPosting));
            } elseif ($request->status === 'offer') {
                $salary = $request->offered_salary ?? 'To be confirmed';
                $startDate = $request->start_date ?? 'To be discussed';
                $notes = $request->offer_notes;
                Mail::to($applicant->email)->send(new OfferLetter($applicant, $applicant->jobPosting, $salary, $startDate, $notes));
            } elseif ($request->status === 'rejected') {
                Mail::to($applicant->email)->send(new RejectionEmail($applicant, $applicant->jobPosting, $request->rejection_note));
            }
        }

        return response()->json($applicant->load('jobPosting'));
    }

    public function mention(string $id, Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'note' => 'required|string|max:1000'
        ]);

        $applicant = Applicant::where('id', $id)
            ->where('tenant_id', $request->user()->tenant_id)
            ->firstOrFail();

        $targetUser = \App\Models\User::findOrFail($request->user_id);

        $targetUser->notify(new \App\Notifications\CandidateMention($applicant, $request->user()->name, $request->note, $request->user()->id));

        return response()->json(['success' => true]);
    }

    public function stats(Request $request): JsonResponse
    {
        $tenantId = $request->user()->tenant_id;
        $query = \App\Models\Applicant::where('applicants.tenant_id', $tenantId)
            ->join('job_postings', 'applicants.job_posting_id', '=', 'job_postings.id')
            ->leftJoin('job_requisitions', 'job_postings.job_requisition_id', '=', 'job_requisitions.id');

        // Apply Global Filters
        if ($request->has('department') && $request->department !== 'All') {
            $query->where(function ($q) use ($request) {
                $q->where('job_postings.department', $request->department)
                    ->orWhere('job_requisitions.department', $request->department);
            });
        }

        if ($request->has('job_id') && $request->job_id !== 'All') {
            $query->where('applicants.job_posting_id', $request->job_id);
        }

        if ($request->has('date_range') && $request->date_range !== 'All') {
            $days = (int) $request->date_range;
            $query->where('applicants.created_at', '>=', now()->subDays($days));
        }

        // 1. Funnel Metrics (using cloned query to maintain filters)
        $funnelQuery = clone $query;
        $totalApplied = $funnelQuery->count();

        $funnelQuery = clone $query;
        $totalInterview = $funnelQuery->where('applicants.status', 'interview')->count();

        $funnelQuery = clone $query;
        $totalOffer = $funnelQuery->where('applicants.status', 'offer')->count();

        $funnelQuery = clone $query;
        $totalHired = $funnelQuery->where('applicants.status', 'hired')->count();

        // 2. Department Breakdown
        $deptQuery = clone $query;
        $departments = $deptQuery->selectRaw('COALESCE(job_postings.department, job_requisitions.department) as department, count(applicants.id) as count')
            ->groupByRaw('COALESCE(job_postings.department, job_requisitions.department)')
            ->get()
            ->filter(fn($d) => !empty($d->department))
            ->values();

        // 3. Time-to-Hire (Average days between created_at and updated_at for Hired candidates)
        $tthQuery = clone $query;
        $hiredApplicants = $tthQuery->where('applicants.status', 'hired')->select('applicants.created_at', 'applicants.updated_at')->get();
        $totalDays = 0;
        foreach ($hiredApplicants as $h) {
            $totalDays += $h->created_at->diffInDays($h->updated_at);
        }
        $avgTimeToHire = $hiredApplicants->count() > 0 ? round($totalDays / $hiredApplicants->count()) : 0;

        // 4. Candidate Sources
        $sourceQuery = clone $query;
        $sources = $sourceQuery->selectRaw('applicants.source, count(applicants.id) as count')
            ->groupBy('applicants.source')
            ->orderByDesc('count')
            ->get();

        // 5. Requisitions (Not strictly tied to applicant filters, but scoping by tenant)
        $reqTotal = \App\Models\JobRequisition::where('tenant_id', $tenantId)->count();
        $reqPending = \App\Models\JobRequisition::where('tenant_id', $tenantId)->where('status', 'pending')->count();

        // 6. Raw Data for Export (Granular Candidate Logs)
        $rawQuery = clone $query;
        $rawData = $rawQuery->select([
            'applicants.name',
            'applicants.email',
            'applicants.phone',
            'applicants.source',
            'applicants.status',
            'applicants.created_at',
            'applicants.updated_at',
            'job_postings.title as job_title',
            \DB::raw('COALESCE(job_postings.department, job_requisitions.department) as department')
        ])->orderBy('applicants.created_at', 'desc')->get();

        $stats = [
            'funnel' => [
                'applied' => $totalApplied,
                'interview' => $totalInterview,
                'offer' => $totalOffer,
                'hired' => $totalHired,
            ],
            'departments' => $departments,
            'velocity' => [
                'average_time_to_hire_days' => $avgTimeToHire
            ],
            'sources' => $sources,
            'requisitions' => [
                'total' => $reqTotal,
                'pending' => $reqPending,
            ],
            'raw_data' => $rawData
        ];

        return response()->json($stats);
    }
}
