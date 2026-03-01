<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class MockApiAuth
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken() ?: $request->query('token');

        if ($token && str_starts_with($token, 'mock-token-id-')) {
            $userId = str_replace('mock-token-id-', '', $token);
            $user = User::find($userId);
            if ($user) {
                Auth::login($user);
                return $next($request);
            }
        }

        // Fallback for the old token just in case
        if ($token === 'mock-auth-token-for-demo') {
            $user = User::where('email', 'admin@droga.com')->first();
            if ($user) {
                Auth::login($user);
                return $next($request);
            }
        }

        return response()->json(['message' => 'Unauthenticated (Mock Mode)'], 401);
    }
}
