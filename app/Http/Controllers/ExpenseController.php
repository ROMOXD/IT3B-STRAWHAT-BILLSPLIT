<?php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ExpenseController extends Controller
{
    public function index(Bill $bill)
    {
        if (!$bill->isAccessibleBy(Auth::id())) {
            abort(403);
        }

        return response()->json(
            $bill->expenses()->with(['payer', 'guestPayer'])->latest()->get()
        );
    }

    public function store(Request $request, Bill $bill)
    {
        if (!$bill->isAccessibleBy(Auth::id())) {
            abort(403);
        }

        $request->validate([
            'expense_name'  => ['required', 'string', 'max:255', 'regex:/^\S.*$/'],
            'amount'        => ['required', 'numeric', 'min:0.01'],
            'expense_date'  => ['required', 'date'],
            'split_type'    => ['required', 'in:equal,custom'],
            'split_with'    => ['nullable', 'array'],
            'split_with.*.participant_id' => ['nullable', 'integer', 'exists:bill_participants,id'],
            'split_with.*.amount'         => ['nullable', 'numeric', 'min:0'],
            'paid_by_type'  => ['required', 'in:user,guest'],
            'paid_by'       => ['nullable', 'exists:users,id'],
            'guest_paid_by' => ['nullable', 'exists:bill_participants,id'],
        ]);

        if ($request->paid_by_type === 'user') {
            $isParticipant = $bill->participants()
                ->where('user_id', $request->paid_by)
                ->where('is_active', true)
                ->exists();
            if (!$isParticipant) {
                return back()->withErrors(['paid_by' => 'Payer must be a participant.']);
            }
        }

        if ($request->split_type === 'custom') {
            $splitTotal = collect($request->split_with ?? [])->sum('amount');
            if (abs($splitTotal - $request->amount) >= 0.01) {
                return back()->withErrors(['split_with' => 'Custom split amounts must equal the total expense amount.']);
            }
        }

        $expense = Expense::create([
            'bill_id'       => $bill->id,
            'expense_name'  => $request->expense_name,
            'paid_by'       => $request->paid_by_type === 'user' ? $request->paid_by : null,
            'guest_paid_by' => $request->paid_by_type === 'guest' ? $request->guest_paid_by : null,
            'amount'        => $request->amount,
            'split_type'    => $request->split_type,
            'split_with'    => $request->split_type === 'custom' ? $request->split_with : null,
            'expense_date'  => $request->expense_date,
        ]);

        $bill->increment('total_amount', $request->amount);

        return back()->with('success', 'Expense added.');
    }

    public function updateName(Request $request, Bill $bill, Expense $expense)
    {
        if (!$bill->isHostedBy(Auth::id()) || $expense->bill_id !== $bill->id) {
            abort(403);
        }

        $request->validate([
            'expense_name' => ['required', 'string', 'max:255', 'regex:/^\S.*$/'],
        ]);

        $expense->update(['expense_name' => $request->expense_name]);

        return back()->with('success', 'Expense name updated.');
    }

    public function update(Request $request, Bill $bill, Expense $expense)
    {
        if (!$bill->isHostedBy(Auth::id()) || $expense->bill_id !== $bill->id) {
            abort(403);
        }

        $request->validate([
            'expense_name'  => ['required', 'string', 'max:255', 'regex:/^\S.*$/'],
            'amount'        => ['required', 'numeric', 'min:0.01'],
            'expense_date'  => ['required', 'date'],
            'split_type'    => ['required', 'in:equal,custom'],
            'split_with'    => ['nullable', 'array'],
            'split_with.*.participant_id' => ['nullable', 'integer', 'exists:bill_participants,id'],
            'split_with.*.amount'         => ['nullable', 'numeric', 'min:0'],
            'paid_by_type'  => ['required', 'in:user,guest'],
            'paid_by'       => ['nullable', 'exists:users,id'],
            'guest_paid_by' => ['nullable', 'exists:bill_participants,id'],
        ]);

        if ($request->split_type === 'custom') {
            $splitTotal = collect($request->split_with ?? [])->sum('amount');
            if (abs($splitTotal - $request->amount) >= 0.01) {
                return back()->withErrors(['split_with' => 'Custom split amounts must equal the total expense amount.']);
            }
        }

        $amountDiff = $request->amount - $expense->amount;

        $expense->update([
            'expense_name'  => $request->expense_name,
            'paid_by'       => $request->paid_by_type === 'user' ? $request->paid_by : null,
            'guest_paid_by' => $request->paid_by_type === 'guest' ? $request->guest_paid_by : null,
            'amount'        => $request->amount,
            'split_type'    => $request->split_type,
            'split_with'    => $request->split_type === 'custom' ? $request->split_with : null,
            'expense_date'  => $request->expense_date,
        ]);

        if ($amountDiff != 0) {
            $bill->increment('total_amount', $amountDiff);
        }

        return back()->with('success', 'Expense updated.');
    }

    public function destroy(Bill $bill, Expense $expense)
    {
        if (!$bill->isHostedBy(Auth::id()) || $expense->bill_id !== $bill->id) {
            abort(403);
        }

        $bill->decrement('total_amount', $expense->amount);
        $expense->delete();

        return back()->with('success', 'Expense deleted.');
    }
}
