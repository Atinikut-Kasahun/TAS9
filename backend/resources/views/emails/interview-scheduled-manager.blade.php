<x-mail::message>
    # New Interview Scheduled

    Hi {{ $interview->interviewer->name }},

    A new interview has been scheduled for you.

    **Candidate:** {{ $interview->applicant->name }}
    **Position:** {{ $interview->applicant->jobPosting->title }}

    **Interview Details:**
    - **Date & Time:** {{ $interview->scheduled_at->format('l, F j, Y \\a\\t g:i A') }}
    - **Type:** {{ ucfirst($interview->type) }}
    @if($interview->location)
        - **Location / Link:** {{ $interview->location }}
    @endif

    @if($customMessage)
        **Message to Candidate:**
        <div
            style="padding: 15px; background: #f9f9f9; border-left: 4px solid #1F7A6E; margin-top: 10px; margin-bottom: 20px;">
            {!! nl2br(e($customMessage)) !!}
        </div>
    @endif


    You can review the candidate's profile and resume in the Talent Acquisition System before the interview.

    <x-mail::button :url="config('app.frontend_url') . '/dashboard?tab=Candidates'">
        View Candidate Profile
    </x-mail::button>

    Thanks,<br>
    {{ config('app.name') }}
</x-mail::message>