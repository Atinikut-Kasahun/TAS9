<?php

namespace App\Http\Controllers;

use App\Models\GlobalSetting;
use App\Models\Event;
use App\Models\User;
use App\Notifications\EventNotification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Notification;

class GroupContentController extends Controller
{
    /**
     * Get all global settings.
     */
    public function getSettings(): JsonResponse
    {
        return response()->json(GlobalSetting::all()->pluck('value', 'key'));
    }

    /**
     * Update a global setting.
     */
    public function updateSetting(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => 'required|string',
            'value' => 'required',
        ]);

        $setting = GlobalSetting::updateOrCreate(
            ['key' => $validated['key']],
            ['value' => $validated['value']]
        );

        return response()->json(['message' => 'Setting updated successfully', 'setting' => $setting]);
    }

    /**
     * List all global events.
     */
    public function listEvents(): JsonResponse
    {
        return response()->json(
            Event::with('tenant')
                ->where('event_date', '>=', now())
                ->orderBy('event_date', 'asc')
                ->get()
        );
    }

    /**
     * Create a new global event.
     */
    public function storeEvent(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => 'required|exists:tenants,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'event_date' => 'required|date_format:Y-m-d\TH:i',
            'location' => 'nullable|string',
            'status' => 'required|in:upcoming,ongoing,past,cancelled',
        ]);

        $event = Event::create($validated);

        // Notify all users of the selected company
        $users = User::where('tenant_id', $validated['tenant_id'])->get();
        Notification::send($users, new EventNotification(
            $event->title,
            $event->event_date,
            $event->location ?? 'N/A'
        ));

        return response()->json(['message' => 'Event created successfully', 'event' => $event]);
    }

    /**
     * Generic file upload for global settings (e.g. Culture Images).
     */
    public function uploadFile(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|max:5120', // Up to 5MB
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('global_assets', 'public');
            return response()->json(['message' => 'File uploaded successfully', 'path' => $path]);
        }

        return response()->json(['message' => 'No file provided'], 400);
    }
}
