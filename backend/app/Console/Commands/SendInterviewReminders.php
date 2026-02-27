<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Interview;
use App\Mail\InterviewReminderMail;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class SendInterviewReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reminders:send';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send 24-hour reminders for upcoming interviews to candidates and hiring managers.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Finding upcoming interviews for tomorrow...');

        // Find interviews scheduled between 24 and 48 hours from now
        $start = Carbon::now()->addHours(24);
        $end = Carbon::now()->addHours(48);

        $interviews = Interview::with(['applicant.jobPosting', 'interviewer', 'tenant'])
            ->where('status', 'scheduled')
            ->whereBetween('scheduled_at', [$start, $end])
            ->get();

        $count = 0;
        foreach ($interviews as $interview) {
            // Send to Applicant
            if ($interview->applicant && $interview->applicant->email) {
                Mail::to($interview->applicant->email)->send(new InterviewReminderMail($interview, 'applicant'));
            }

            // Send to Manager/Interviewer
            if ($interview->interviewer && $interview->interviewer->email) {
                Mail::to($interview->interviewer->email)->send(new InterviewReminderMail($interview, 'manager'));
            }

            $count++;
        }

        $this->info("Sent reminders for {$count} interviews.");
        return 0;
    }
}
