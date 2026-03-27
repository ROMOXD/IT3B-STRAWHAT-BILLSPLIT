<?php

namespace App\Http\Responses;

use App\Models\BillParticipant;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    public function toResponse($request)
    {
        $user = Auth::user();

        if ($user && $user->email) {
            // Auto-verify email if not already verified
            if (!$user->email_verified_at) {
                $user->forceFill(['email_verified_at' => now()])->save();
            }

            BillParticipant::where('guest_email', $user->email)
                ->whereNull('user_id')
                ->update([
                    'user_id'          => $user->id,
                    'guest_firstname'  => null,
                    'guest_lastname'   => null,
                    'guest_nickname'   => null,
                    'guest_email'      => null,
                    'guest_token'      => null,
                    'guest_expires_at' => null,
                ]);
        }

        return redirect()->intended(route('dashboard'));
    }
}
