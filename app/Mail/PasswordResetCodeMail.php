<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetCodeMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public User $user, public string $code) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Your SplitBill Password Reset Code');
    }

    public function content(): Content
    {
        return new Content(markdown: 'emails.password-reset-code', with: [
            'user' => $this->user,
            'code' => $this->code,
        ]);
    }
}
