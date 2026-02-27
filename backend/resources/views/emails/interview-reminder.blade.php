<x-mail::message>
    # Interview Reminder

    @if($recipientType === 'applicant')
        Dear {{ $interview->applicant->name }},

        This is a friendly reminder of your upcoming interview tomorrow for the
        **{{ $interview->applicant->jobPosting->title }}** position at **{{ $interview->tenant->name }}**.
    @else
        Hi {{ $interview->interviewer->name }},

        This is a reminder of your upcoming interview tomorrow with candidate **{{ $interview->applicant->name }}** for the
        **{{ $interview->applicant->jobPosting->title }}** position.
    @endif

    **Interview Details:**
    - **Date & Time:** {{ $interview->scheduled_at->format('l, F j, Y \\a\\t g:i A') }}
    - **Type:** {{ ucfirst($interview->type) }}
    @if($interview->location)
        - **Location / Link:** {{ $interview->location }}
    @endif

    Please ensure you are ready at the scheduled time.

    Thanks,<br>
    {{ config('app.name') }} System
</x-mail::message>