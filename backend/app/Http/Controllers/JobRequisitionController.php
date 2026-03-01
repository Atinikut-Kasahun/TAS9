<?php

namespace App\Http\Controllers;

use App\Models\JobRequisition;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class JobRequisitionController extends Controller
{
    /**
     * Display a listing of requisitions for the user's tenant.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = JobRequisition::with(['requester', 'approvedBy']);

        // Tenant Isolation (except Global Admin)
        if (!$user->hasRole('admin')) {
            $query->where('tenant_id', $user->tenant_id);
        }

        // Role-based filtering
        if ($user->hasRole('hiring_manager')) {
            $query->where('requested_by', $user->id);
        }

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'LIKE', "%{$search}%")
                    ->orWhere('department', 'LIKE', "%{$search}%")
                    ->orWhere('priority', 'LIKE', "%{$search}%");
            });
        }

        $requisitions = $query->orderBy('created_at', 'desc')->get();

        // Calculate KPIs
        $kpis = [
            'open_requests' => $requisitions->where('status', 'pending')->count(),
            'approved_this_quarter' => $requisitions->where('status', 'approved')
                ->where('approved_at', '>=', now()->startOfQuarter())->count(),
            'team_growth' => $requisitions->where('status', 'approved')->sum('headcount'),
            'awaiting_approval' => $requisitions->where('status', 'pending')->count(),
            'avg_approval_time_hours' => round($requisitions->where('status', 'approved')->avg(function ($r) {
                return $r->created_at->diffInHours($r->approved_at);
            }) ?? 0, 1),
        ];

        return response()->json([
            'data' => $requisitions,
            'kpis' => $kpis
        ]);
    }

    /**
     * Store a newly created requisition.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'department' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'description' => 'nullable|string',
            'headcount' => 'required|integer|min:1',
            'priority' => 'required|in:low,medium,high,urgent',
        ]);

        $user = $request->user();
        $tenantId = $user->tenant_id ?? \App\Models\Tenant::first()?->id;

        if (!$tenantId) {
            return response()->json(['error' => 'No active company context found.'], 400);
        }

        $requisition = JobRequisition::create([
            'tenant_id' => $tenantId,
            'requested_by' => $user->id,
            'title' => $request->title,
            'description' => $request->description,
            'department' => $request->department,
            'location' => $request->location,
            'headcount' => $request->headcount ?? 1,
            'budget' => $request->budget,
            'position_type' => $request->position_type ?? 'new',
            'priority' => $request->priority ?? 'medium',
            'status' => 'pending',
        ]);

        // Notify HR Managers
        $hrManagers = \App\Models\User::where('tenant_id', $tenantId)
            ->whereHas('roles', function ($q) {
                $q->where('slug', 'hr_manager');
            })->get();

        foreach ($hrManagers as $hrManager) {
            $hrManager->notify(new \App\Notifications\RequisitionApprovalAlert($requisition));
        }

        return response()->json($requisition, 201);
    }

    public function duplicate(string $id, Request $request): JsonResponse
    {
        $original = JobRequisition::findOrFail($id);

        // Security Check
        if (!$request->user()->hasRole('admin') && $original->tenant_id !== $request->user()->tenant_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $new = $original->replicate(['status', 'rejection_reason', 'approved_at', 'approved_by']);
        $new->requested_by = $request->user()->id;
        $new->status = 'pending';
        $new->save();

        return response()->json($new, 201);
    }

    /**
     * Bulk approve multiple requisitions (HR Manager only).
     */
    public function bulkApprove(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->hasRole('hr_manager') && !$user->hasRole('admin')) {
            return response()->json(['error' => 'Only HR Managers can bulk approve requisitions.'], 403);
        }

        $request->validate(['ids' => 'required|array', 'ids.*' => 'integer']);

        $updated = JobRequisition::whereIn('id', $request->ids)
            ->where('tenant_id', $user->tenant_id)
            ->where('status', 'pending')
            ->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => $user->id,
            ]);

        return response()->json(['approved_count' => $updated]);
    }

    /**
     * Approve or reject a requisition (TA Manager Role).
     */
    public function updateStatus(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $request->validate([
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'required_if:status,rejected|string',
        ]);

        $requisition = JobRequisition::findOrFail($id);

        // Security Check
        if (!$user->hasRole('admin') && $requisition->tenant_id !== $user->tenant_id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Only HR Managers (or Admins) can approve/reject
        if (!$user->hasRole('hr_manager') && !$user->hasRole('admin')) {
            return response()->json(['error' => 'Only HR Managers can authorize requisitions.'], 403);
        }

        $requisition->update([
            'status' => $request->status,
            'rejection_reason' => $request->rejection_reason,
            'approved_at' => $request->status === 'approved' ? now() : null,
            'approved_by' => $request->status === 'approved' ? $user->id : null,
        ]);

        return response()->json($requisition);
    }
}
