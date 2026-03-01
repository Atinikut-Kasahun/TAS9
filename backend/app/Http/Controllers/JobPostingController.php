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

        // If the user is specifically a hiring manager (not an admin or TA manager),
        // only show jobs derived from their explicit requisitions.
        if ($user->hasRole('hiring_manager') && !$user->hasRole('admin') && !$user->hasRole('ta_manager')) {
            $query->whereHas('requisition', function ($q) use ($user) {
                $q->where('requested_by', $user->id);
            });
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

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $perPage = $request->input('per_page', 10);
        return response()->json($query->orderBy('created_at', 'desc')->paginate($perPage));
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
            'department' => $requisition->department,
            'description' => $request->description,
            'location' => $requisition->location,
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
        $perPage = request()->input('per_page', 9);
        $query = JobPosting::with('tenant')
            ->where('status', 'active');

        if (request()->has('department') && request()->department && request()->department !== 'All Departments') {
            $query->where('department', request()->department);
        }

        if (request()->has('search') && request()->search) {
            $search = request()->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'LIKE', "%{$search}%")
                    ->orWhere('location', 'LIKE', "%{$search}%")
                    ->orWhere('department', 'LIKE', "%{$search}%");
            });
        }

        $jobs = $query->orderBy('created_at', 'desc')->paginate($perPage);

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

    /**
     * Global Admin: all jobs across all companies.
     */
    public function indexGlobal(Request $request): JsonResponse
    {
        $query = JobPosting::with(['tenant', 'requisition'])
            ->withCount('applicants');

        if ($request->has('tenant_id') && $request->tenant_id) {
            $query->where('tenant_id', $request->tenant_id);
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'LIKE', "%{$search}%")
                    ->orWhere('department', 'LIKE', "%{$search}%");
            });
        }

        $perPage = $request->input('per_page', 10);
        return response()->json($query->orderBy('created_at', 'desc')->paginate($perPage));
    }
}
