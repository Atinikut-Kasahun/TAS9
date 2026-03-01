<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

use App\Models\JobRequisition;

$count = JobRequisition::where('location', '!=', '')->whereNotNull('location')->count();
echo "Requisitions with location: $count\n";

if ($count > 0) {
    $req = JobRequisition::where('location', '!=', '')->whereNotNull('location')->first();
    echo "Sample - ID: {$req->id} | Location: '{$req->location}'\n";
}

$all = JobRequisition::all();
foreach ($all as $r) {
    echo "ID: {$r->id} | Loc: '{$r->location}' | Dept: '{$r->department}'\n";
}
