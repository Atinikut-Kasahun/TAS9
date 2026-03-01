<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * TenantScopeMiddleware
 *
 * Stores the authenticated user's tenant_id on the request so that
 * any controller can call $request->tenantId() to scope queries.
 * This is the first line of defense against cross-tenant data leaks.
 */
class TenantScopeMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Global admins have no tenant_id restriction — they see everything.
        if ($user->hasRole('admin')) {
            $request->attributes->set('tenant_id', null); // null = unrestricted
            return $next($request);
        }

        if (empty($user->tenant_id)) {
            return response()->json(['message' => 'No company assigned to this account. Contact your administrator.'], 403);
        }

        // Bind the tenant_id to the request for use in controllers
        $request->attributes->set('tenant_id', $user->tenant_id);

        return $next($request);
    }
}
