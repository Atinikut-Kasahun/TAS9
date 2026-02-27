<?php

use App\Http\Controllers\JobController;
use App\Http\Controllers\ApplicantController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Auth Routes
Route::post('/login', [\App\Http\Controllers\AuthController::class, 'login']);

Route::middleware('mock.auth')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user()->load('tenant', 'roles');
    });

    Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index']);

    Route::post('/logout', [\App\Http\Controllers\AuthController::class, 'logout']);

    // Requisition API
    Route::prefix('v1')->group(function () {
        Route::get('/requisitions', [\App\Http\Controllers\JobRequisitionController::class, 'index']);
        Route::post('/requisitions', [\App\Http\Controllers\JobRequisitionController::class, 'store']);
        Route::post('/requisitions/bulk-approve', [\App\Http\Controllers\JobRequisitionController::class, 'bulkApprove']);
        Route::post('/requisitions/{id}/duplicate', [\App\Http\Controllers\JobRequisitionController::class, 'duplicate']);
        Route::patch('/requisitions/{id}/status', [\App\Http\Controllers\JobRequisitionController::class, 'updateStatus']);

        Route::get('/jobs', [\App\Http\Controllers\JobPostingController::class, 'index']);
        Route::post('/jobs', [\App\Http\Controllers\JobPostingController::class, 'store']);

        // Internal Job Management
        Route::apiResource('jobs', \App\Http\Controllers\JobController::class)->except(['index', 'show']);

        // Applicant Management
        Route::get('/applicants/stats', [\App\Http\Controllers\ApplicantController::class, 'stats']);
        Route::get('/applicants', [\App\Http\Controllers\ApplicantController::class, 'index']);
        Route::patch('/applicants/{id}/status', [\App\Http\Controllers\ApplicantController::class, 'updateStatus']);
        Route::post('/applicants/{id}/mention', [\App\Http\Controllers\ApplicantController::class, 'mention']);
        // Interview Management
        Route::get('/interviews', [\App\Http\Controllers\InterviewController::class, 'index']);
        Route::post('/interviews', [\App\Http\Controllers\InterviewController::class, 'store']);
        Route::patch('/interviews/{id}', [\App\Http\Controllers\InterviewController::class, 'update']);
        // Offer Management
        Route::post('/offers/generate', [\App\Http\Controllers\OfferController::class, 'generate']);

        // Notifications
        Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index']);
        Route::post('/notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead']);
        Route::post('/notifications/mark-all-read', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead']);
        Route::post('/notifications/{id}/reply', [\App\Http\Controllers\NotificationController::class, 'reply']);

        // Users for mentions & compose
        Route::get('/users', function (Request $request) {
            return response()->json(\App\Models\User::where('tenant_id', $request->user()->tenant_id)
                ->where('id', '!=', $request->user()->id)
                ->get(['id', 'name', 'email']));
        });

        // Compose a free-form direct message to any colleague
        Route::post('/messages/send', function (Request $request) {
            $request->validate([
                'to_user_id' => 'required|exists:users,id',
                'message' => 'required|string|max:2000',
            ]);
            $recipient = \App\Models\User::where('id', $request->to_user_id)
                ->where('tenant_id', $request->user()->tenant_id)
                ->firstOrFail();
            $recipient->notify(new \App\Notifications\DirectMessage(
                $request->user()->name,
                $request->user()->id,
                $request->message
            ));
            return response()->json(['success' => true]);
        });
    });
});

// Public API
Route::prefix('v1')->group(function () {
    Route::get('/public/jobs', [\App\Http\Controllers\JobPostingController::class, 'publicIndex']);
    Route::get('/public/jobs/{id}', [\App\Http\Controllers\JobPostingController::class, 'publicShow']);
    Route::post('/apply', [\App\Http\Controllers\JobApplicationController::class, 'store']);

    // Public Document Access (Simplified for viewing)
    Route::get('/applicants/{id}/resume', function ($id) {
        $applicant = \App\Models\Applicant::findOrFail($id);
        $path = storage_path('app/public/' . $applicant->resume_path);
        if (!file_exists($path)) {
            return response()->json(['error' => 'File not found'], 404);
        }
        return response()->file($path, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="resume.pdf"',
        ]);
    });

    Route::get('/attachments/{id}/view', function ($id) {
        $attachment = \App\Models\ApplicantAttachment::findOrFail($id);
        $path = storage_path('app/public/' . $attachment->file_path);
        if (!file_exists($path)) {
            return response()->json(['error' => 'File not found'], 404);
        }
        $contentType = \Illuminate\Support\Facades\File::mimeType($path);
        return response()->file($path, [
            'Content-Type' => $contentType,
            'Content-Disposition' => 'inline; filename="' . $attachment->label . '"',
        ]);
    });
});
