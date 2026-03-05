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
            'tenant',
            'jobPosting.requisition',
            'attachments',
            'interviews' => function ($q) {
                $q->latest();
            }
        ]);

        if (!$user->hasRole('admin')) {
            $query->where('tenant_id', $user->tenant_id);
        } elseif ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->tenant_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('email', 'LIKE', "%{$search}%")
                    ->orWhere('phone', 'LIKE', "%{$search}%")
                    ->orWhere('professional_background', 'LIKE', "%{$search}%");
            });
        }

        if ($request->filled('job_posting_id')) {
            $query->where('job_posting_id', $request->job_posting_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
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
            'status' => 'required|in:applied,phone_screen,interview,offer,hired,rejected,under_review,shortlisted,new',
            'feedback' => 'nullable|string',
            'offered_salary' => 'nullable|string|max:100',
            'start_date' => 'nullable|string|max:100',
            'offer_notes' => 'nullable|string|max:1000',
            'rejection_note' => 'nullable|string|max:1000',
        ]);

        $authUser = $request->user();
        $query = Applicant::where('id', $id);

        if (!$authUser->hasRole('admin')) {
            $query->where('tenant_id', $authUser->tenant_id);
        }

        $applicant = $query->firstOrFail();

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
            if ($request->status === 'offer') {
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
        $user = $request->user();
        $isAdmin = $user->hasRole('admin');
        $tenantId = $user->tenant_id;

        $cacheKey = 'applicant_stats_' . ($isAdmin ? 'admin' : $tenantId) . '_' . md5(json_encode($request->all()));

        return \Illuminate\Support\Facades\Cache::remember($cacheKey, now()->addMinutes(10), function () use ($request, $isAdmin, $tenantId) {
            $query = \App\Models\Applicant::query()
                ->select('applicants.*')
                ->join('job_postings', 'applicants.job_posting_id', '=', 'job_postings.id')
                ->leftJoin('job_requisitions', 'job_postings.job_requisition_id', '=', 'job_requisitions.id')
                ->leftJoin('tenants', 'applicants.tenant_id', '=', 'tenants.id');

            if (!$isAdmin) {
                $query->where('applicants.tenant_id', $tenantId);
            }

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

            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('applicants.name', 'LIKE', "%{$search}%")
                        ->orWhere('applicants.email', 'LIKE', "%{$search}%")
                        ->orWhere('applicants.phone', 'LIKE', "%{$search}%")
                        ->orWhere('applicants.professional_background', 'LIKE', "%{$search}%");
                });
            }

            // 1. Funnel Metrics
            $funnelStats = (clone $query)
                ->selectRaw("
                    COUNT(*) as total,
                    SUM(CASE WHEN applicants.status = 'interview' THEN 1 ELSE 0 END) as interview,
                    SUM(CASE WHEN applicants.status = 'offer' THEN 1 ELSE 0 END) as offer,
                    SUM(CASE WHEN applicants.status = 'hired' THEN 1 ELSE 0 END) as hired
                ")->first();

            // 2. Department Breakdown
            $departments = (clone $query)
                ->selectRaw('COALESCE(job_postings.department, job_requisitions.department) as department, count(applicants.id) as count')
                ->groupByRaw('COALESCE(job_postings.department, job_requisitions.department)')
                ->get()
                ->filter(fn($d) => !empty($d->department))
                ->values();

            // 3. Time-to-Hire (Optimized to DB aggregate)
            $avgTimeToHire = (clone $query)
                ->where('applicants.status', 'hired')
                ->selectRaw('AVG(DATEDIFF(applicants.updated_at, applicants.created_at)) as avg_days')
                ->value('avg_days') ?? 0;

            // 4. Candidate Sources
            $sources = (clone $query)
                ->selectRaw('applicants.source, count(applicants.id) as count')
                ->groupBy('applicants.source')
                ->orderByDesc('count')
                ->get();

            // 5. Requisitions
            $reqQuery = \App\Models\JobRequisition::query();
            if (!$isAdmin) {
                $reqQuery->where('tenant_id', $tenantId);
            }
            $reqStats = $reqQuery->selectRaw('COUNT(*) as total, SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending')->first();

            // 6. Raw Data for Export (Limit to most recent 500 for performance if it's just for a table/preview)
            $rawData = (clone $query)->select([
                'applicants.name',
                'applicants.email',
                'applicants.phone',
                'applicants.source',
                'applicants.status',
                'applicants.created_at',
                'applicants.updated_at',
                'job_postings.title as job_title',
                'tenants.name as company_name',
                \DB::raw('COALESCE(job_postings.department, job_requisitions.department) as department')
            ])->orderBy('applicants.created_at', 'desc')->limit(500)->get();

            return response()->json([
                'funnel' => [
                    'applied' => $funnelStats->total,
                    'interview' => $funnelStats->interview,
                    'offer' => $funnelStats->offer,
                    'hired' => $funnelStats->hired,
                ],
                'departments' => $departments,
                'velocity' => [
                    'average_time_to_hire_days' => round($avgTimeToHire)
                ],
                'sources' => $sources,
                'requisitions' => [
                    'total' => $reqStats->total,
                    'pending' => $reqStats->pending ?? 0,
                ],
                'raw_data' => $rawData
            ]);
        });
    }

    public function export(Request $request)
    {
        $user = $request->user();
        $isAdmin = $user->hasRole('admin');
        $tenantId = $user->tenant_id;

        $query = \App\Models\Applicant::query()
            ->join('job_postings', 'applicants.job_posting_id', '=', 'job_postings.id')
            ->leftJoin('job_requisitions', 'job_postings.job_requisition_id', '=', 'job_requisitions.id')
            ->leftJoin('tenants', 'applicants.tenant_id', '=', 'tenants.id');

        if (!$isAdmin) {
            $query->where('applicants.tenant_id', $tenantId);
        }

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

        $rawData = $query->select([
            'applicants.name',
            'applicants.email',
            'applicants.phone',
            'applicants.source',
            'applicants.status',
            'applicants.created_at',
            'applicants.updated_at',
            'job_postings.title as job_title',
            'tenants.name as company_name',
            \DB::raw('COALESCE(job_postings.department, job_requisitions.department) as department')
        ])->orderBy('applicants.created_at', 'desc')->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="Candidate_Export_' . now()->format('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($rawData) {
            $file = fopen('php://output', 'w');
            // Byte Order Mark (BOM) for Excel
            fputs($file, "\xEF\xBB\xBF");

            fputcsv($file, [
                'Company Name',
                'Candidate Name',
                'Candidate Email',
                'Candidate Phone',
                'Job Title',
                'Department',
                'Current Status',
                'Application Date',
                'Hired Date/Time'
            ]);

            foreach ($rawData as $row) {
                $hiredDateTime = '';
                if ($row->status === 'hired' && $row->updated_at) {
                    $hiredDateTime = $row->updated_at->format('Y-m-d H:i:s');
                }

                fputcsv($file, [
                    $row->company_name,
                    $row->name,
                    $row->email,
                    $row->phone,
                    $row->job_title,
                    $row->department,
                    $row->status,
                    $row->created_at->format('Y-m-d'),
                    $hiredDateTime
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
