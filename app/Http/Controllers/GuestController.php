<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\BillParticipant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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

        if ($request->filled('email')) {
            $registeredUser = User::where('email', $request->email)
                ->whereIn('usertype', ['standard', 'premium'])
                ->first();

            if ($registeredUser) {
                // Auto-verify if needed, then redirect to login
                if (!$registeredUser->email_verified_at) {
                    $registeredUser->forceFill(['email_verified_at' => now()])->save();
                }
                return back()->withErrors(['email' => 'This email belongs to a registered account. Please log in instead.']);
            }

            $participant = BillParticipant::where('bill_id', $bill->id)
                ->where('guest_email', $request->email)
                ->where('is_active', true)
                ->first();

            if ($participant) {
                $participant->refreshGuestAccess();
                session(['guest_participant_id' => $participant->id, 'guest_token' => $participant->guest_token]);
                return redirect()->route('guest.bill', $bill->id);
            }
        }

        return Inertia::render('guest/register', [
            'bill'          => ['id' => $bill->id, 'billname' => $bill->billname, 'invitation_code' => $bill->invitation_code],
            'prefill_email' => $request->email ?? '',
        ]);
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

        $registeredUser = User::where('email', $request->email)
            ->whereIn('usertype', ['standard', 'premium'])
            ->first();

        if ($registeredUser) {
            return back()->withErrors(['email' => 'This email belongs to a registered account. Please log in.']);
        }

        // Block if this email is already an active participant in this bill
        $alreadyInBill = BillParticipant::where('bill_id', $bill->id)
            ->where('guest_email', $request->email)
            ->where('is_active', true)
            ->exists();

        if ($alreadyInBill) {
            return back()->withErrors(['email' => 'This email is already a participant in this bill.']);
        }

        // Reuse or create participant row
        $participant = BillParticipant::where('bill_id', $bill->id)
            ->where('guest_email', $request->email)
            ->first();

        if ($participant) {
            $participant->update([
                'guest_firstname' => $request->firstname,
                'guest_lastname'  => $request->lastname,
                'is_active'       => true,
            ]);
        } else {
            $participant = BillParticipant::create([
                'bill_id'         => $bill->id,
                'user_id'         => null,
                'guest_firstname' => $request->firstname,
                'guest_lastname'  => $request->lastname,
                'guest_email'     => $request->email,
                'is_active'       => true,
            ]);
            $bill->increment('people_count');
        }

        $participant->refreshGuestAccess();
        session(['guest_participant_id' => $participant->id, 'guest_token' => $participant->guest_token]);

        return redirect()->route('guest.bill', $bill->id);
    }

    public function showBill(Bill $bill)
    {
        $participant = $this->resolveGuestParticipant();

        if (!$participant || $participant->bill_id !== $bill->id) {
            return redirect()->route('guest.lookup')
                ->withErrors(['access' => 'Access denied. Please use your invitation code.']);
        }

        if ($participant->isGuestAccessExpired()) {
            session()->forget(['guest_participant_id', 'guest_token']);
            return redirect()->route('guest.lookup')
                ->withErrors(['access' => 'Your 6-hour guest access has expired. Please enter your code again.']);
        }

        $bill->load(['host', 'participants.user', 'expenses.payer', 'expenses.guestPayer']);

        $participants = $bill->participants()->where('is_active', true)->with('user')->get()->map(fn($p) => [
            'id'              => $p->id,
            'user_id'         => $p->user_id,
            'name'            => $p->user
                                    ? $p->user->firstname . ' ' . $p->user->lastname
                                    : trim(($p->guest_firstname ?? '') . ' ' . ($p->guest_lastname ?? '')),
            'is_guest'        => is_null($p->user_id),
            'guest_firstname' => $p->guest_firstname,
            'guest_lastname'  => $p->guest_lastname,
            'guest_nickname'  => $p->guest_nickname,
            'guest_email'     => $p->guest_email,
        ]);

        return Inertia::render('guest/bill', [
            'bill'             => $bill,
            'participants'     => $participants,
            'guestParticipant' => [
                'id'         => $participant->id,
                'firstname'  => $participant->guest_firstname,
                'lastname'   => $participant->guest_lastname,
                'nickname'   => $participant->guest_nickname,
                'email'      => $participant->guest_email,
                'expires_at' => $participant->guest_expires_at,
            ],
        ]);
    }

    public function upgrade(Request $request)
    {
        $participant = $this->resolveGuestParticipant();

        if (!$participant) {
            return redirect()->route('guest.lookup')
                ->withErrors(['access' => 'Session expired. Please use your invitation code again.']);
        }

        $request->validate([
            'username' => ['required', 'string', 'max:100', 'regex:/^\S.*$/', 'unique:users,username'],
            'nickname' => ['required', 'string', 'max:100', 'regex:/^\S.*$/', 'unique:users,nickname'],
            'password' => [
                'required', 'string', 'min:8', 'max:16',
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).+$/',
                'confirmed',
            ],
        ]);

        // Case B: email already registered → tell them to log in
        if (User::where('email', $participant->guest_email)->whereIn('usertype', ['standard', 'premium'])->exists()) {
            return back()->withErrors(['email' => 'This email is already registered. Please log in to claim your account.']);
        }

        $user = User::create([
            'firstname'         => $participant->guest_firstname,
            'lastname'          => $participant->guest_lastname,
            'email'             => $participant->guest_email,
            'username'          => $request->username,
            'nickname'          => $request->nickname,
            'password'          => Hash::make($request->password),
            'usertype'          => 'standard',
            'email_verified_at' => now(),
        ]);

        // Link all participant rows with this email to the new user
        BillParticipant::where('guest_email', $participant->guest_email)
            ->whereNull('user_id')
            ->update([
                'user_id'          => $user->id,
                'guest_firstname'  => null,
                'guest_lastname'   => null,
                'guest_email'      => null,
                'guest_token'      => null,
                'guest_expires_at' => null,
            ]);

        session()->forget(['guest_participant_id', 'guest_token']);

        Auth::login($user, true);

        // Regenerate session to prevent fixation, then go straight to dashboard
        $request->session()->regenerate();

        return redirect()->route('dashboard')->with('success', 'Account created! Welcome to SplitBill.');
    }

    /**
     * Called after a registered user logs in — links any guest participant rows
     * that share their email to their user account.
     */
    public function claimGuestEntries(Request $request)
    {
        $user = Auth::user();

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

        return redirect()->intended(route('dashboard'));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function resolveGuestParticipant(): ?BillParticipant
    {
        $id    = session('guest_participant_id');
        $token = session('guest_token');

        if (!$id || !$token) return null;

        return BillParticipant::where('id', $id)
            ->where('guest_token', $token)
            ->whereNull('user_id')
            ->first();
    }

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
