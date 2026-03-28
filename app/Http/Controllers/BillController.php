<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\BillParticipant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class BillController extends Controller
{
    public function index()
    {
        $user   = Auth::user();
        $userId = $user->id;

        [$bills, $archivedBills] = Bill::with(['host', 'participants.user'])
            ->forUser($userId)
            ->latest()
            ->get()
            ->partition(fn($b) => $b->status === 'active');

        $hostedThisMonth = $user->hostedBills()
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $users = User::where('id', '!=', $userId)
            ->whereIn('usertype', ['standard', 'premium'])
            ->select('id', 'firstname', 'lastname', 'email')
            ->get()
            ->map(fn($u) => [
                'id'    => $u->id,
                'name'  => $u->firstname . ' ' . $u->lastname,
                'email' => $u->email,
            ]);

        return Inertia::render('dashboard', [
            'bills'         => $bills->map(fn($b) => array_merge($b->toArray(), ['is_host' => $b->hostid === $userId]))->values(),
            'archivedBills' => $archivedBills->map(fn($b) => array_merge($b->toArray(), ['is_host' => $b->hostid === $userId]))->values(),
            'users'         => $users,
            'usertype'      => $user->usertype,
            'canCreateBill' => $user->canCreateBill(),
            'hostedCount'   => $hostedThisMonth,
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();

        if (!$user->canCreateBill()) {
            return back()->with('error', 'You have reached your monthly bill limit of 5 bills.');
        }

        $request->validate([
            'billname'                        => ['required', 'string', 'max:100', 'regex:/^\S.*$/'],
            'participants'                    => ['nullable', 'array'],
            'participants.*.type'             => ['required', 'in:user,guest'],
            'participants.*.user_id'          => ['nullable', 'exists:users,id'],
            'participants.*.guest_firstname'  => ['nullable', 'string', 'max:100', 'regex:/^\S.*$/'],
            'participants.*.guest_lastname'   => ['nullable', 'string', 'max:100', 'regex:/^\S.*$/'],
            'participants.*.guest_nickname'   => ['nullable', 'string', 'max:100', 'regex:/^\S.*$/'],
            'participants.*.guest_email'      => ['nullable', 'email', 'max:255'],
        ]);

        $participantCount = 1 + count($request->participants ?? []);

        if ($user->usertype === 'standard' && $participantCount > 3) {
            return back()->withErrors(['participants' => 'Standard users can only add up to 3 people per bill (including yourself).']);
        }

        $bill = Bill::create([
            'billname'        => $request->billname,
            'hostid'          => $user->id,
            'invitation_code' => Bill::generateUniqueInvitationCode(),
            'people_count'    => 1,
        ]);

        // Add host as participant
        $bill->participants()->create(['user_id' => $user->id, 'is_active' => true]);

        // Collect emails and nicknames used so far (host has none)
        $usedNicknames = [];
        $usedEmails    = [];

        // Add other participants
        foreach ($request->participants ?? [] as $p) {
            if ($p['type'] === 'user' && !empty($p['user_id'])) {
                $bill->participants()->create(['user_id' => $p['user_id'], 'is_active' => true]);
                $bill->increment('people_count');
            } elseif ($p['type'] === 'guest' && !empty($p['guest_firstname'])) {
                $nickname = $p['guest_nickname'] ?? null;
                $email    = !empty($p['guest_email']) ? strtolower($p['guest_email']) : null;

                if ($nickname && in_array(strtolower($nickname), $usedNicknames)) {
                    return back()->withErrors(['participants' => "Nickname '{$nickname}' is already used by another participant."]);
                }
                if ($email && in_array($email, $usedEmails)) {
                    return back()->withErrors(['participants' => "Email '{$p['guest_email']}' is already used by another participant."]);
                }

                if ($nickname) $usedNicknames[] = strtolower($nickname);
                if ($email)    $usedEmails[]    = $email;

                $bill->participants()->create([
                    'user_id'         => null,
                    'guest_firstname' => $p['guest_firstname'],
                    'guest_lastname'  => $p['guest_lastname'] ?? null,
                    'guest_nickname'  => $nickname,
                    'guest_email'     => $p['guest_email'] ?? null,
                    'is_active'       => true,
                ]);
                $bill->increment('people_count');
            }
        }

        return redirect()->route('bills.show', $bill->id)->with('success', 'Bill created successfully.');
    }

    public function show(Bill $bill)
    {
        if (!$bill->isAccessibleBy(Auth::id())) {
            abort(403);
        }

        $bill->load(['host', 'participants.user', 'expenses.payer', 'expenses.guestPayer']);

        $participants = $bill->participants
            ->where('is_active', true)
            ->map(fn($p) => [
            'id'              => $p->id,
            'user_id'         => $p->user_id,
            'name'            => $p->user ? $p->user->firstname . ' ' . $p->user->lastname
                                          : trim(($p->guest_firstname ?? '') . ' ' . ($p->guest_lastname ?? '')),
            'is_guest'        => is_null($p->user_id),
            'guest_firstname' => $p->guest_firstname,
            'guest_lastname'  => $p->guest_lastname,
            'guest_nickname'  => $p->guest_nickname,
            'guest_email'     => $p->guest_email,
        ]);

        $allParticipants = $bill->participants
            ->map(fn($p) => [
                'id'   => $p->id,
                'name' => $p->user ? $p->user->firstname . ' ' . $p->user->lastname
                                   : trim(($p->guest_firstname ?? '') . ' ' . ($p->guest_lastname ?? '')),
            ])
            ->keyBy('id');

        $expenses = $bill->expenses->map(function ($e) use ($allParticipants) {
            $payerName = 'Unknown';
            if ($e->payer) {
                $payerName = $e->payer->firstname . ' ' . $e->payer->lastname;
            } elseif ($e->guestPayer) {
                $payerName = trim(($e->guestPayer->guest_firstname ?? '') . ' ' . ($e->guestPayer->guest_lastname ?? '')) ?: 'Guest';
            } elseif ($e->paid_by && isset($allParticipants[$e->paid_by])) {
                $payerName = $allParticipants[$e->paid_by]['name'];
            }

            return [
                'id'           => $e->id,
                'expense_name' => $e->expense_name,
                'amount'       => $e->amount,
                'split_type'   => $e->split_type,
                'expense_date' => $e->expense_date,
                'payer_name'   => $payerName,
                'paid_by'      => $e->paid_by,
                'guest_paid_by'=> $e->guest_paid_by,
                'split_with'   => $e->split_with,
            ];
        });

        $availableUsers = User::where('id', '!=', Auth::id())
            ->where('usertype', '!=', 'guest')
            ->whereNotIn('id', $bill->participants()->whereNotNull('user_id')->pluck('user_id'))
            ->select('id', 'firstname', 'lastname', 'email')
            ->get()
            ->map(fn($u) => [
                'id'    => $u->id,
                'name'  => $u->firstname . ' ' . $u->lastname,
                'email' => $u->email,
            ]);

        return Inertia::render('bills/show', [
            'bill'           => [
                'id'              => $bill->id,
                'billname'        => $bill->billname,
                'invitation_code' => $bill->invitation_code,
                'hostid'          => $bill->hostid,
                'status'          => $bill->status,
                'total_amount'    => $bill->total_amount,
                'people_count'    => $bill->people_count,
                'expenses'        => $expenses->values(),
            ],
            'participants'   => $participants->values(),
            'availableUsers' => $availableUsers,
            'isHost'         => $bill->isHostedBy(Auth::id()),
            'usertype'       => Auth::user()->usertype,
        ]);
    }

    public function update(Request $request, Bill $bill)
    {
        if (!$bill->isHostedBy(Auth::id())) {
            abort(403);
        }

        $request->validate([
            'billname' => ['required', 'string', 'max:100', 'regex:/^\S.*$/'],
        ]);

        $bill->update(['billname' => $request->billname]);

        return back()->with('success', 'Bill updated.');
    }

    public function destroy(Bill $bill)
    {
        if (!$bill->isHostedBy(Auth::id())) {
            abort(403);
        }

        $bill->update(['status' => 'deleted']);
        $bill->delete();

        return redirect()->route('dashboard')->with('success', 'Bill deleted.');
    }

    public function archive(Bill $bill)
    {
        if (!$bill->isHostedBy(Auth::id())) {
            abort(403);
        }

        $bill->archive();

        return back()->with('success', 'Bill archived.');
    }

    public function unarchive(Bill $bill)
    {
        if (!$bill->isHostedBy(Auth::id())) {
            abort(403);
        }

        $bill->reactivate();

        return back()->with('success', 'Bill restored.');
    }

    public function regenerateCode(Bill $bill)
    {
        if (!$bill->isHostedBy(Auth::id())) {
            abort(403);
        }

        $code = $bill->regenerateInvitationCode();

        return back()->with('success', 'Invitation code regenerated.')->with('new_code', $code);
    }

    public function addParticipant(Request $request, Bill $bill)
    {
        if (!$bill->isHostedBy(Auth::id())) {
            abort(403);
        }

        $request->validate([
            'type'            => ['required', 'in:user,guest'],
            'user_id'         => ['nullable', 'exists:users,id'],
            'guest_firstname' => ['nullable', 'string', 'max:100', 'regex:/^\S.*$/'],
            'guest_lastname'  => ['nullable', 'string', 'max:100', 'regex:/^\S.*$/'],
            'guest_nickname'  => ['nullable', 'string', 'max:100', 'regex:/^\S.*$/'],
            'guest_email'     => ['nullable', 'email', 'max:255'],
        ]);

        $host = $bill->host;
        if ($host->usertype === 'standard') {
            $actualCount = $bill->participants()->where('is_active', true)->count();
            if ($actualCount >= 3) {
                return back()->withErrors(['participant' => 'Standard accounts can only have up to 3 people per bill.']);
            }
        }

        if ($request->type === 'user' && $request->user_id) {
            $bill->addParticipant($request->user_id);
        } elseif ($request->type === 'guest' && $request->guest_firstname) {
            // Nickname uniqueness within bill
            if ($request->guest_nickname) {
                $nicknameTaken = $bill->participants()
                    ->where('is_active', true)
                    ->where('guest_nickname', $request->guest_nickname)
                    ->exists();
                if ($nicknameTaken) {
                    return back()->withErrors(['guest_nickname' => 'This nickname is already used in this bill.']);
                }
            }
            // Duplicate email within bill
            if ($request->guest_email) {
                $emailTaken = $bill->participants()
                    ->where('is_active', true)
                    ->where('guest_email', $request->guest_email)
                    ->exists();
                if ($emailTaken) {
                    return back()->withErrors(['guest_email' => 'A participant with this email already exists in this bill.']);
                }
            }
            $bill->participants()->create([
                'user_id'         => null,
                'guest_firstname' => $request->guest_firstname,
                'guest_lastname'  => $request->guest_lastname,
                'guest_nickname'  => $request->guest_nickname,
                'guest_email'     => $request->guest_email,
                'is_active'       => true,
            ]);
            $bill->increment('people_count');
        }

        return back()->with('success', 'Participant added.');
    }

    public function removeParticipant(Bill $bill, BillParticipant $participant)
    {
        if (!$bill->isHostedBy(Auth::id())) {
            abort(403);
        }

        $participant->update(['is_active' => false]);
        $bill->decrement('people_count');

        return back()->with('success', 'Participant removed.');
    }
}
