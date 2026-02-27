<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Applicant extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'job_posting_id',
        'name',
        'email',
        'phone',
        'age',
        'gender',
        'professional_background',
        'years_of_experience',
        'resume_path',
        'photo_path',
        'portfolio_link',
        'status', // new, screening, interview, offered, hired, rejected
        'source', // website, social media, ethiojobs
        'match_score',
        'feedback',
    ];

    public function attachments()
    {
        return $this->hasMany(ApplicantAttachment::class);
    }

    protected $casts = [
        'feedback' => 'array',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function interviews()
    {
        return $this->hasMany(Interview::class);
    }

    public function jobPosting(): BelongsTo
    {
        return $this->belongsTo(JobPosting::class);
    }
}
