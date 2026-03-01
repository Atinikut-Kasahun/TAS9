<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Tenant;
use App\Notifications\DirectMessage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;

class MessageController extends Controller
{
    /**
     * Get list of users that can be messaged.
     * For Global Admin, this returns all users.
     */
    public function users(Request $request): JsonResponse
    {
        $query = User::query();

        // If not global admin, only show users in the same tenant
        if (!$request->user()->roles()->where('slug', 'admin')->exists()) {
            $query->where('tenant_id', $request->user()->tenant_id)
                ->where('id', '!=', $request->user()->id);
        } else {
            $query->where('id', '!=', $request->user()->id);
        }

        $users = $query->with('tenant')->get(['id', 'name', 'email', 'tenant_id']);

        return response()->json($users);
    }

    /**
     * Send a direct message to a user.
     */
    public function send(Request $request): JsonResponse
    {
        $request->validate([
            'to_user_id' => 'required|exists:users,id',
            'message' => 'required|string|max:2000',
        ]);

        $recipient = User::findOrFail($request->to_user_id);

        // Authorization: Non-admins can only message users in their own tenant
        if (!$request->user()->roles()->where('slug', 'admin')->exists()) {
            if ($recipient->tenant_id !== $request->user()->tenant_id) {
                return response()->json(['error' => 'Unauthorized to message this user.'], 403);
            }
        }

        $recipient->notify(new DirectMessage(
            $request->user()->name,
            $request->user()->id,
            $request->message
        ));

        return response()->json(['success' => true]);
    }
}
