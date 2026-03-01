<?php

namespace App\Http\Controllers;

use App\Models\Applicant;
use App\Models\JobPosting;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class GlobalSearchController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $query = $request->query('q');

        if (empty($query) || strlen($query) < 2) {
            return response()->json([
                'companies' => [],
                'candidates' => [],
                'jobs' => [],
                'users' => [],
            ]);
        }

        $companies = Tenant::where('name', 'LIKE', "%{$query}%")
            ->limit(5)
            ->get(['id', 'name']);

        $candidates = Applicant::where('name', 'LIKE', "%{$query}%")
            ->orWhere('email', 'LIKE', "%{$query}%")
            ->limit(5)
            ->get(['id', 'name', 'email', 'tenant_id']);

        $jobs = JobPosting::where('title', 'LIKE', "%{$query}%")
            ->limit(5)
            ->get(['id', 'title', 'tenant_id']);

        $users = User::where('name', 'LIKE', "%{$query}%")
            ->orWhere('email', 'LIKE', "%{$query}%")
            ->limit(5)
            ->get(['id', 'name', 'email', 'tenant_id']);

        return response()->json([
            'companies' => $companies,
            'candidates' => $candidates,
            'jobs' => $jobs,
            'users' => $users,
        ]);
    }
}
