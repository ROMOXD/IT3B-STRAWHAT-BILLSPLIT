<?php

namespace App\Http\Responses;

use App\Mail\VerificationCodeMail;
use Illuminate\Support\Facades\Mail;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

class RegisterResponse implements RegisterResponseContract
{
    public function toResponse($request)
    {
        $user = $request->user();

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->forceFill([
            'email_verification_code'            => $code,
            'email_verification_code_expires_at' => now()->addMinutes(15),
        ])->save();

        Mail::to($user->email)->queue(new VerificationCodeMail($user, $code));

        return $request->wantsJson()
            ? response()->json(['two_factor' => false])
            : redirect()->route('verification.notice');
    }
}
