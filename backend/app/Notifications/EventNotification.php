<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class EventNotification extends Notification
{
    use Queueable;

    protected $eventTitle;
    protected $eventDate;
    protected $location;

    public function __construct($eventTitle, $eventDate, $location)
    {
        $this->eventTitle = $eventTitle;
        $this->eventDate = $eventDate;
        $this->location = $location;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $formattedDate = date('M d, Y', strtotime($this->eventDate));
        $formattedTime = date('h:i A', strtotime($this->eventDate));

        return [
            'type' => 'global_event',
            'title' => "New Group Event: {$this->eventTitle}",
            'message' => "A new company event has been scheduled for {$formattedDate} at {$formattedTime} in {$this->location}.",
            'event_title' => $this->eventTitle,
            'event_date' => $this->eventDate,
            'location' => $this->location,
        ];
    }
}
