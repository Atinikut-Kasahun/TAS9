<?php

namespace App\Http\Controllers;

use App\Models\JobPosting;
use App\Models\JobRequisition;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class JobPostingController extends Controller
{
    /**
     * Display internal job postings.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = JobPosting::with('requisition');

        if (!$user->hasRole('admin')) {
            $query->where('tenant_id', $user->tenant_id);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'LIKE', "%{$search}%")
                    ->orWhere('location', 'LIKE', "%{$search}%")
                    ->orWhere('department', 'LIKE', "%{$search}%")
                    ->orWhereHas('requisition', function ($sq) use ($search) {
                        $sq->where('department', 'LIKE', "%{$search}%");
                    });
            });
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    /**
     * Create a job posting from a requisition.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'job_requisition_id' => 'required|exists:job_requisitions,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'location' => 'required|string',
            'type' => 'required|in:full-time,part-time,contract',
        ]);

        $user = $request->user();
        $requisition = JobRequisition::findOrFail($request->job_requisition_id);

        // Security check
        if (!$user->hasRole('admin') && $requisition->tenant_id !== $user->tenant_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($requisition->status !== 'approved') {
            return response()->json(['error' => 'Requisition must be approved before posting.'], 400);
        }

        $job = JobPosting::create([
            'tenant_id' => $requisition->tenant_id,
            'job_requisition_id' => $requisition->id,
            'title' => $request->title,
            'description' => $request->description,
            'location' => $requisition->location ?? 'Addis Ababa',
            'type' => $request->type,
            'status' => 'active',
        ]);

        return response()->json($job, 201);
    }

    /**
     * Public endpoint to list active jobs.
     */
    public function publicIndex(): JsonResponse
    {
        $jobs = JobPosting::with('tenant')
            ->where('status', 'active')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($jobs);
    }

    /**
     * Public endpoint to show a specific job.
     */
    public function publicShow(string $id): JsonResponse
    {
        $job = JobPosting::with('tenant')
            ->where('status', 'active')
            ->findOrFail($id);

        return response()->json($job);
    }
}
