<?php

namespace App\Http\Controllers;

use App\Mail\VerificationCodeMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class EmailVerificationCodeController extends Controller
{
    public function send(Request $request)
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return redirect()->route('dashboard');
        }

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->forceFill([
            'email_verification_code'             => $code,
            'email_verification_code_expires_at'  => now()->addMinutes(15),
        ])->save();

        Mail::to($user->email)->queue(new VerificationCodeMail($user, $code));

        return back()->with('status', 'verification-code-sent');
    }

    public function verify(Request $request)
    {
        $request->validate(['code' => ['required', 'string', 'size:6']]);

        $user = $request->user();

        if (
            $user->email_verification_code !== $request->code ||
            now()->isAfter($user->email_verification_code_expires_at)
        ) {
            return back()->withErrors(['code' => 'The code is invalid or has expired.']);
        }

        $user->forceFill([
            'email_verified_at'                   => now(),
            'email_verification_code'             => null,
            'email_verification_code_expires_at'  => null,
        ])->save();

        return redirect()->route('dashboard');
    }
}
