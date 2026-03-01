<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Role;
use App\Models\Tenant;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use App\Policies\AdminPolicy;
use Illuminate\Support\Facades\Gate;

class UserController extends Controller
{
    /**
     * Display a listing of all users (Global Admin) or tenant users (Company Admin).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = User::with(['tenant', 'roles']);

        // Search filter
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (!$user->hasRole('admin')) {
            if (!$user->tenant_id)
                return response()->json(['message' => 'Unauthorized'], 403);
            $query->where('tenant_id', $user->tenant_id);
        }

        $perPage = $request->input('per_page', 10);
        $users = $query->latest()->paginate($perPage);

        return response()->json($users);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        $admin = $request->user();
        $isGlobalAdmin = $admin->hasRole('admin');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'role_slug' => 'required|exists:roles,slug',
            'tenant_id' => $isGlobalAdmin ? 'required|exists:tenants,id' : 'nullable',
        ]);

        $tenantId = $isGlobalAdmin ? $validated['tenant_id'] : $admin->tenant_id;

        if (!$tenantId) {
            return response()->json(['message' => 'Unauthorized: No company assigned.'], 403);
        }

        // Auto-generate strong password
        $autoPassword = ucfirst(Str::random(4)) . '-' . Str::random(4);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($autoPassword),
            'tenant_id' => $tenantId,
        ]);

        $role = Role::where('slug', $validated['role_slug'])->first();
        if ($role) {
            $user->roles()->attach($role->id);
        }

        $user->load(['tenant', 'roles']);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user,
            'generated_password' => $autoPassword
        ], 201);
    }

    /**
     * Update a user's role.
     */
    public function updateRole(Request $request, $id)
    {
        $admin = $request->user();
        $user = User::findOrFail($id);

        // Security: Company admins can only update users in their own company
        if (!$admin->hasRole('admin') && $user->tenant_id !== $admin->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'role_slug' => 'required|exists:roles,slug',
        ]);

        $role = Role::where('slug', $validated['role_slug'])->first();
        if ($role) {
            $user->roles()->sync([$role->id]);
        }

        $user->load(['tenant', 'roles']);

        return response()->json([
            'message' => 'Role updated successfully',
            'user' => $user
        ]);
    }

    /**
     * Reset a user's password.
     */
    public function resetPassword(Request $request, $id)
    {
        $admin = $request->user();
        $user = User::findOrFail($id);

        if (!$admin->hasRole('admin') && $user->tenant_id !== $admin->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $autoPassword = ucfirst(Str::random(4)) . '-' . Str::random(4);

        $user->update([
            'password' => Hash::make($autoPassword),
        ]);

        return response()->json([
            'message' => 'Password reset successfully',
            'generated_password' => $autoPassword
        ]);
    }

    /**
     * Delete a user.
     */
    public function destroy(Request $request, $id)
    {
        $admin = $request->user();
        $user = User::findOrFail($id);

        if (!$admin->hasRole('admin') && $user->tenant_id !== $admin->tenant_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->id === $admin->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully']);
    }
}
