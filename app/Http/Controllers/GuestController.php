<?php

namespace App\Http\Controllers;

use App\Mail\VerificationCodeMail;
use App\Models\Bill;
use App\Models\BillParticipant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class GuestController extends Controller
{
    public function showLookup()
    {
        return Inertia::render('guest/lookup');
    }

    public function lookup(Request $request)
    {
        $request->validate([
            'code'  => ['required', 'string'],
            'email' => ['nullable', 'email', 'max:255'],
        ]);

        $bill = Bill::where('invitation_code', strtoupper($request->code))->active()->first();

        if (!$bill) {
            return back()->withErrors(['code' => 'Invalid or expired invitation code.']);
        }

        $host = $bill->host;
        if ($host->usertype === 'standard') {
            $actualCount = $bill->participants()->where('is_active', true)->count();
            if ($actualCount >= 3) {
                return back()->withErrors(['code' => 'This bill has reached its maximum number of participants.']);
            }
        }

        if ($request->filled('email')) {
            // If a standard/premium user, tell them to log in
            $registeredUser = User::where('email', $request->email)
                ->whereIn('usertype', ['standard', 'premium'])
                ->first();

            if ($registeredUser) {
                return back()->withErrors(['email' => 'This email belongs to a registered account. Please log in instead.']);
            }

            // If an existing guest user for this bill, log them in
            $guestUser = User::where('email', $request->email)
                ->where('usertype', 'guest')
                ->where('bill_id', $bill->id)
                ->first();

            if ($guestUser) {
                $guestUser->forceFill([
                    'guest_access_expires_at' => now()->addHours(6),
                    'email_verified_at' => now(),
                ])->save();
                Auth::login($guestUser);
                $request->session()->regenerate();
                return redirect()->route('dashboard');
            }
        }

        return Inertia::render('guest/register', [
            'bill'          => ['id' => $bill->id, 'billname' => $bill->billname, 'invitation_code' => $bill->invitation_code],
            'prefill_email' => $request->email ?? '',
        ]);
    }

    public function loginGuest(Request $request)
    {
        $request->validate(['email' => ['required', 'email', 'max:255']]);

        $email = $request->email;

        $guestUser = User::where('email', $email)->where('usertype', 'guest')->first();

        if (!$guestUser) {
            $participant = BillParticipant::where('guest_email', $email)
                ->where('is_active', true)
                ->whereNull('user_id')
                ->latest()
                ->first();

            if (!$participant) {
                return back()->withErrors(['email' => 'The provided credentials are incorrect.']);
            }

            $guestUser = User::create([
                'firstname'               => $participant->guest_firstname ?? 'Guest',
                'lastname'                => $participant->guest_lastname ?? '',
                'username'                => $this->uniqueField('username', strtolower(($participant->guest_firstname ?? 'guest') . ($participant->guest_lastname ?? ''))),
                'nickname'                => $this->uniqueField('nickname', strtolower($participant->guest_firstname ?? 'guest')),
                'email'                   => $email,
                'password'                => Hash::make(str()->random(32)),
                'usertype'                => 'guest',
                'bill_id'                 => $participant->bill_id,
                'guest_access_expires_at' => now()->addHours(6),
                'email_verified_at'       => now(),
            ]);

            BillParticipant::where('guest_email', $email)
                ->whereNull('user_id')
                ->update(['user_id' => $guestUser->id]);
        }

        // Send OTP instead of logging in directly
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $guestUser->forceFill([
            'email_verification_code'            => $code,
            'email_verification_code_expires_at' => now()->addMinutes(15),
            'guest_access_expires_at'            => now()->addHours(6),
        ])->save();

        Mail::to($guestUser->email)->queue(new VerificationCodeMail($guestUser, $code));

        // Store guest id in session to verify against
        session(['guest_login_id' => $guestUser->id]);

        return redirect()->route('guest.otp');
    }

    public function showOtp()
    {
        if (!session('guest_login_id')) {
            return redirect()->route('guest.lookup');
        }

        return Inertia::render('guest/otp');
    }

    public function verifyOtp(Request $request)
    {
        $request->validate(['code' => ['required', 'string', 'size:6']]);

        $guestId = session('guest_login_id');

        if (!$guestId) {
            return redirect()->route('guest.lookup');
        }

        $guestUser = User::find($guestId);

        if (
            !$guestUser ||
            $guestUser->email_verification_code !== $request->code ||
            now()->isAfter($guestUser->email_verification_code_expires_at)
        ) {
            return back()->withErrors(['code' => 'The code is invalid or has expired.']);
        }

        $guestUser->forceFill([
            'email_verification_code'            => null,
            'email_verification_code_expires_at' => null,
            'email_verified_at'                  => now(),
        ])->save();

        session()->forget('guest_login_id');

        Auth::login($guestUser);
        $request->session()->regenerate();

        return redirect()->route('dashboard');
    }

    public function register(Request $request)
    {
        $request->validate([
            'firstname'       => ['required', 'string', 'max:100', 'regex:/^\S.*$/'],
            'lastname'        => ['required', 'string', 'max:100', 'regex:/^\S.*$/'],
            'email'           => ['required', 'email', 'max:255'],
            'invitation_code' => ['required', 'string'],
        ]);

        $bill = Bill::where('invitation_code', strtoupper($request->invitation_code))->active()->firstOrFail();

        // Block registered users
        if (User::where('email', $request->email)->whereIn('usertype', ['standard', 'premium'])->exists()) {
            return back()->withErrors(['email' => 'This email belongs to a registered account. Please log in.']);
        }

        // Reuse or create guest user
        $guestUser = User::where('email', $request->email)
            ->where('usertype', 'guest')
            ->first();

        // Check if this guest is already a participant in this bill
        $alreadyInBill = $guestUser && $bill->participants()
            ->where('user_id', $guestUser->id)
            ->where('is_active', true)
            ->exists();

        // Enforce participant limit for new joiners
        if (!$alreadyInBill) {
            $host = $bill->host;
            if ($host->usertype === 'standard') {
                $actualCount = $bill->participants()->where('is_active', true)->count();
                if ($actualCount >= 3) {
                    return back()->withErrors(['invitation_code' => 'This bill has reached its maximum of 3 participants.']);
                }
            }
        }

        if ($guestUser) {
            // Update their info and refresh access
            $guestUser->forceFill([
                'firstname'               => $request->firstname,
                'lastname'                => $request->lastname,
                'bill_id'                 => $bill->id,
                'guest_access_expires_at' => now()->addHours(6),
            ])->save();

            // Add as participant if not already in this bill
            if (!$alreadyInBill) {
                $bill->participants()->create(['user_id' => $guestUser->id, 'is_active' => true]);
                $bill->increment('people_count');
            }
        } else {
            $guestUser = User::create([
                'firstname'               => $request->firstname,
                'lastname'                => $request->lastname,
                'username'                => $this->uniqueField('username', strtolower($request->firstname . $request->lastname)),
                'nickname'                => $this->uniqueField('nickname', strtolower($request->firstname)),
                'email'                   => $request->email,
                'password'                => Hash::make(str()->random(32)), // random unusable password
                'usertype'                => 'guest',
                'bill_id'                 => $bill->id,
                'invitation_code'         => strtoupper($request->invitation_code),
                'guest_access_expires_at' => now()->addHours(6),
                'email_verified_at'       => now(), // guests skip email verification
            ]);

            // Add as bill participant
            $bill->participants()->create(['user_id' => $guestUser->id, 'is_active' => true]);
            $bill->increment('people_count');
        }

        Auth::login($guestUser);
        $request->session()->regenerate();

        return redirect()->route('dashboard');
    }

    public function upgrade(Request $request)
    {
        $user = Auth::user();

        if ($user->usertype !== 'guest') {
            return redirect()->route('dashboard');
        }

        $request->validate([
            'password' => [
                'required', 'string', 'min:8', 'max:16',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/',
                'confirmed',
            ],
        ]);

        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->forceFill([
            'password'                           => Hash::make($request->password),
            'usertype'                           => 'standard',
            'bill_id'                            => null,
            'guest_access_expires_at'            => null,
            'email_verified_at'                  => null,
            'email_verification_code'            => $code,
            'email_verification_code_expires_at' => now()->addMinutes(15),
        ])->save();

        Mail::to($user->email)->queue(new VerificationCodeMail($user, $code));

        return redirect()->route('verification.notice');
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function uniqueField(string $field, string $base): string
    {
        $candidate = $base;
        $suffix    = 1;
        while (User::where($field, $candidate)->exists()) {
            $candidate = $base . $suffix++;
        }
        return $candidate;
    }
}
