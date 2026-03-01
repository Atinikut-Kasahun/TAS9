<?php

namespace App\Http\Controllers;

use App\Models\JobPosting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class JobController extends Controller
{
    /**
     * Display a listing of job postings for a specific tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = JobPosting::query();

        if ($user && !$user->hasRole('admin')) {
            $query->where('tenant_id', $user->tenant_id);
        } else {
            // For public view, only show active jobs
            $query->where('status', 'active');
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'LIKE', "%{$search}%")
                    ->orWhere('department', 'LIKE', "%{$search}%")
                    ->orWhere('description', 'LIKE', "%{$search}%");
            });
        }

        $jobs = $query->orderBy('created_at', 'desc')->get();

        return response()->json($jobs);
    }

    /**
     * Store a newly created job posting.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'requirements' => 'nullable|array',
            'location' => 'nullable|string',
            'type' => 'required|in:full-time,part-time,contract',
            'job_requisition_id' => 'nullable|exists:job_requisitions,id',
        ]);

        $user = $request->user();
        $tenantId = $user->tenant_id ?? \App\Models\Tenant::first()?->id;

        if (!$tenantId) {
            return response()->json(['error' => 'No active company context found.'], 400);
        }

        $location = $request->location;
        $department = $request->department;

        if ($request->job_requisition_id) {
            $requisition = \App\Models\JobRequisition::find($request->job_requisition_id);
            if ($requisition) {
                $location = $location ?: $requisition->location;
                $department = $department ?: $requisition->department;
            }
        }

        $job = JobPosting::create([
            'tenant_id' => $tenantId,
            'job_requisition_id' => $request->job_requisition_id,
            'title' => $request->title,
            'department' => $department,
            'description' => $request->description,
            'requirements' => $request->requirements,
            'location' => $location,
            'type' => $request->type,
            'status' => 'active',
        ]);

        return response()->json($job, 201);
    }

    /**
     * Display the specified job posting.
     */
    public function show(string $id, Request $request): JsonResponse
    {
        $job = JobPosting::where('id', $id)
            ->where('tenant_id', $request->user()->tenant_id)
            ->firstOrFail();

        return response()->json($job);
    }

    /**
     * Update the specified job posting.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $job = JobPosting::where('id', $id)
            ->where('tenant_id', $request->user()->tenant_id)
            ->firstOrFail();

        $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'status' => 'sometimes|in:active,closed,draft',
        ]);

        $job->update($request->all());

        return response()->json($job);
    }

    /**
     * Remove the specified job posting.
     */
    public function destroy(string $id, Request $request): JsonResponse
    {
        $job = JobPosting::where('id', $id)
            ->where('tenant_id', $request->user()->tenant_id)
            ->firstOrFail();

        $job->delete();

        return response()->json(null, 204);
    }
}
