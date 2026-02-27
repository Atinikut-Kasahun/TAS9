<x-mail::message>
    # Interview Scheduled

    Dear {{ $interview->applicant->name }},

    We are pleased to inform you that an interview has been scheduled for your application for the
    **{{ $interview->applicant->jobPosting->title }}** position at **{{ $interview->tenant->name }}**.

    **Interview Details:**
    - **Date & Time:** {{ $interview->scheduled_at->format('l, F j, Y \\a\\t g:i A') }}
    - **Type:** {{ ucfirst($interview->type) }}
    @if($interview->location)
        - **Location / Link:** {{ $interview->location }}
    @endif
    - **Interviewer:** {{ $interview->interviewer->name }}

    @if($customMessage)
        **Message from the Hiring Team:**
        <div
            style="padding: 15px; background: #f9f9f9; border-left: 4px solid #1F7A6E; margin-top: 10px; margin-bottom: 20px;">
            {!! nl2br(e($customMessage)) !!}
        </div>
    @endif

    Please make sure to be available at the scheduled time. If you need to reschedule or have any questions, please
    contact us.

    We look forward to speaking with you!

    Thanks,<br>
    {{ $interview->tenant->name }} Hiring Team
</x-mail::message>