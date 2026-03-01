<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JobPosting extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'job_requisition_id',
        'title',
        'department',
        'description',
        'requirements',
        'location',
        'type', // full-time, part-time, contract
        'status', // draft, active, closed
    ];

    protected $casts = [
        'requirements' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function requisition(): BelongsTo
    {
        return $this->belongsTo(JobRequisition::class, 'job_requisition_id');
    }

    public function applicants(): HasMany
    {
        return $this->hasMany(Applicant::class);
    }
}
