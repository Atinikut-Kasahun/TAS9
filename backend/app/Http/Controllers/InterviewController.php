<?php

namespace App\Http\Controllers;

use App\Models\Interview;
use App\Models\Applicant;
use App\Models\User;
use App\Mail\InterviewScheduledApplicant;
use App\Mail\InterviewScheduledManager;
use Illuminate\Support\Facades\Mail;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class InterviewController extends Controller
{
    /**
     * Display a listing of interviews for the tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Interview::where('tenant_id', $user->tenant_id)
            ->with(['applicant', 'interviewer']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->orderBy('scheduled_at', 'asc')->get());
    }

    /**
     * Store a newly scheduled interview.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'applicant_id' => 'required|exists:applicants,id',
            'interviewer_id' => 'required|exists:users,id',
            'scheduled_at' => 'required|date',
            'location' => 'nullable|string',
            'type' => 'required|in:phone,video,in-person',
            'message' => 'nullable|string',
        ]);

        $user = $request->user();

        $interview = Interview::create([
            'tenant_id' => $user->tenant_id,
            'applicant_id' => $request->applicant_id,
            'interviewer_id' => $request->interviewer_id,
            'scheduled_at' => $request->scheduled_at,
            'location' => $request->location,
            'type' => $request->type,
            'status' => 'scheduled',
        ]);

        // Load relationships for emails
        $interview->load(['applicant.jobPosting', 'interviewer', 'tenant']);

        // Send Email to Applicant
        Mail::to($interview->applicant->email)->send(new InterviewScheduledApplicant($interview, $request->message));

        // Send Email to Manager/Interviewer
        Mail::to($interview->interviewer->email)->send(new InterviewScheduledManager($interview, $request->message));

        return response()->json($interview, 201);
    }

    /**
     * Update interview feedback and status.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $interview = Interview::where('id', $id)
            ->where('tenant_id', $request->user()->tenant_id)
            ->firstOrFail();

        $request->validate([
            'status' => 'sometimes|in:completed,cancelled',
            'feedback' => 'nullable|string',
            'rating' => 'nullable|integer|min:1|max:5',
        ]);

        $feedback = $interview->feedback ?? [];
        if ($request->feedback) {
            $feedback[] = [
                'user' => $request->user()->name,
                'note' => $request->feedback,
                'rating' => $request->rating,
                'date' => now()->toDateTimeString(),
            ];
        }

        $updateData = $request->only('status', 'rating');
        if ($request->feedback) {
            $updateData['feedback'] = $feedback;
        }

        $interview->update($updateData);

        return response()->json($interview);
    }
}
