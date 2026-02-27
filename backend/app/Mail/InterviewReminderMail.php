<?php

namespace App\Mail;

use App\Models\Interview;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InterviewReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public $interview;
    public $recipientType; // 'applicant' or 'manager'

    /**
     * Create a new message instance.
     */
    public function __construct(Interview $interview, $recipientType)
    {
        $this->interview = $interview;
        $this->recipientType = $recipientType;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subject = $this->recipientType === 'applicant'
            ? 'Reminder: Upcoming Interview for ' . $this->interview->applicant->jobPosting->title
            : 'Reminder: Upcoming Interview with ' . $this->interview->applicant->name;

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            markdown: 'emails.interview-reminder',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
