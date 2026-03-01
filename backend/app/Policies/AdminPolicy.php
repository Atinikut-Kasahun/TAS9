<?php

namespace App\Policies;

use App\Models\User;

/**
 * AdminPolicy
 *
 * Centralizes all "Global Admin only" permission checks.
 * Use this via the Gate facade or by calling Policy::check() in controllers.
 */
class AdminPolicy
{
    /**
     * Only Global Admins can perform any admin action.
     */
    public function before(User $user, string $ability): bool|null
    {
        // Short-circuit: if the user is an admin, allow everything in this policy
        if ($user->hasRole('admin')) {
            return true;
        }

        return null; // Fall through to individual methods
    }

    public function manageUsers(User $user): bool
    {
        return false; // blocked for non-admins by `before()` returning null
    }

    public function manageCompanies(User $user): bool
    {
        return false;
    }

    public function viewGlobalDashboard(User $user): bool
    {
        return false;
    }
}
