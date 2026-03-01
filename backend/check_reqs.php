<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\JobRequisition;

$requisitions = JobRequisition::take(10)->get();

foreach ($requisitions as $req) {
    echo "ID: {$req->id} | Title: {$req->title} | Location: '{$req->location}' | Department: '{$req->department}'\n";
}
