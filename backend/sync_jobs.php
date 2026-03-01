<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\JobPosting;

$jobs = JobPosting::whereNotNull('job_requisition_id')->with('requisition')->get();

foreach ($jobs as $job) {
    if ($job->requisition) {
        $job->update([
            'location' => $job->requisition->location,
            'department' => $job->requisition->department
        ]);
        echo "Updated Job ID: {$job->id} with Location: {$job->requisition->location}\n";
    }
}
