<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\JobPosting;

// Update any job that still has the hardcoded "Addis Ababa" to pull from its requisition, 
// or set to null if no requisition location exists.
$jobs = JobPosting::all();

foreach ($jobs as $job) {
    $newLoc = $job->location;
    $newDept = $job->department;

    if ($job->requisition) {
        $newLoc = $job->requisition->location ?: null;
        $newDept = $job->requisition->department ?: $job->department;
    } else {
        // If it was the seeded job, it had "Addis Ababa" hardcoded.
        if ($job->location === 'Addis Ababa') {
            $newLoc = null;
        }
    }

    $job->update([
        'location' => $newLoc,
        'department' => $newDept
    ]);

    echo "ID: {$job->id} | Title: {$job->title} | Final Loc: '{$newLoc}' | Final Dept: '{$newDept}'\n";
}
