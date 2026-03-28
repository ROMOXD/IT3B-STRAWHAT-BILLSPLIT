<?php

namespace App\Http\Controllers;

use App\Mail\PasswordResetCodeMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class PasswordResetCodeController extends Controller
{
    public function show(Request $request)
    {
        return Inertia::render('auth/forgot-password', [
            'step'  => $request->session()->get('password_reset_step', 'email'),
            'email' => $request->session()->get('password_reset_email'),
        ]);
    }

    public function send(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);

        $user = User::where('email', $request->email)->first();

        if ($user) {
            $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            $user->forceFill([
                'password_reset_code'            => $code,
                'password_reset_code_expires_at' => now()->addMinutes(15),
            ])->save();

            Mail::to($user->email)->queue(new PasswordResetCodeMail($user, $code));
        }

        $request->session()->put('password_reset_step', 'otp');
        $request->session()->put('password_reset_email', $request->email);

        return redirect()->route('password.request');
    }

    public function verify(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'code'  => ['required', 'string', 'size:6'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (
            ! $user ||
            $user->password_reset_code !== $request->code ||
            now()->isAfter($user->password_reset_code_expires_at)
        ) {
            return back()->withErrors(['code' => 'The code is invalid or has expired.']);
        }

        $user->forceFill(['password_reset_code' => null])->save();

        $request->session()->put('password_reset_step', 'password');
        $request->session()->put('password_reset_email', $request->email);

        return redirect()->route('password.request');
    }

    public function cancel(Request $request)
    {
        $request->session()->forget(['password_reset_step', 'password_reset_email']);

        return redirect()->route('password.request');
    }

    public function reset(Request $request)
    {
        $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'max:16',
                           'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/',
                           'confirmed'],
        ]);

        $user = User::where('email', $request->email)
            ->whereNull('password_reset_code')
            ->first();

        if (! $user) {
            return back()->withErrors(['email' => 'Session expired. Please start over.']);
        }

        $user->forceFill([
            'password'                       => Hash::make($request->password),
            'password_reset_code_expires_at' => null,
        ])->save();

        $request->session()->forget(['password_reset_step', 'password_reset_email']);

        return redirect()->route('login')->with('status', 'Password reset successfully. Please log in.');
    }
}
