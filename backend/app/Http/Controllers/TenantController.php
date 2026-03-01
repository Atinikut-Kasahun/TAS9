<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tenant;
use App\Policies\AdminPolicy;
use Illuminate\Support\Facades\Gate;

class TenantController extends Controller
{
    /**
     * List all companies (tenants).
     */
    public function index(Request $request)
    {
        if (!$request->user()->hasRole('admin'))
            return response()->json(['message' => 'Unauthorized'], 403);
        return response()->json(Tenant::withCount(['users', 'jobPostings', 'jobRequisitions'])->get());
    }

    /**
     * Create a new company (tenant).
     */
    public function store(Request $request)
    {
        if (!$request->user()->hasRole('admin'))
            return response()->json(['message' => 'Unauthorized'], 403);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:tenants',
        ]);

        $validated['slug'] = \Illuminate\Support\Str::slug($validated['name']);

        $tenant = Tenant::create($validated);

        return response()->json(['message' => 'Company created successfully', 'tenant' => $tenant], 201);
    }

    /**
     * Update a company (tenant) name.
     */
    public function update(Request $request, $id)
    {
        if (!$request->user()->hasRole('admin'))
            return response()->json(['message' => 'Unauthorized'], 403);

        $tenant = Tenant::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:tenants,name,' . $tenant->id,
        ]);

        $tenant->update($validated);

        return response()->json(['message' => 'Company renamed successfully', 'tenant' => $tenant]);
    }

    /**
     * Delete a company (tenant). Prevents deletion if it still has users.
     */
    public function destroy(Request $request, $id)
    {
        if (!$request->user()->hasRole('admin'))
            return response()->json(['message' => 'Unauthorized'], 403);

        $tenant = Tenant::withCount('users')->findOrFail($id);

        if ($tenant->users_count > 0) {
            return response()->json([
                'message' => "Cannot delete \"{$tenant->name}\" — it still has {$tenant->users_count} user(s). Remove all users first."
            ], 422);
        }

        $tenant->delete();

        return response()->json(['message' => 'Company deleted successfully']);
    }
}
