<?php
// app/Http/Controllers/ExpenseController.php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ExpenseController extends Controller
{
    public function index(Bill $bill)
    {
        if (!$bill->isAccessibleBy(Auth::id())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $expenses = $bill->expenses()->with('payer')->latest()->get();

        return response()->json($expenses);
    }

    public function store(Request $request, Bill $bill)
    {
        if (!$bill->isAccessibleBy(Auth::id())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
            'expense_date' => 'required|date',
            'paid_by' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Check if paid_by is a participant
        $isParticipant = $bill->participants()
                              ->where('user_id', $request->paid_by)
                              ->where('is_active', true)
                              ->exists();

        if (!$isParticipant) {
            return response()->json(['message' => 'Payer must be a participant'], 422);
        }

        $expense = Expense::create([
            'bill_id' => $bill->id,
            'paid_by' => $request->paid_by,
            'amount' => $request->amount,
            'expense_date' => $request->expense_date,
        ]);

        // Update bill total
        $bill->total_amount += $request->amount;
        $bill->save();

        return response()->json([
            'message' => 'Expense created',
            'expense' => $expense->load('payer')
        ], 201);
    }

    public function update(Request $request, Bill $bill, Expense $expense)
    {
        if (!$bill->isAccessibleBy(Auth::id()) || $expense->bill_id !== $bill->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'amount' => 'sometimes|numeric|min:0.01',
            'expense_date' => 'sometimes|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Update bill total if amount changed
        if ($request->has('amount') && $request->amount != $expense->amount) {
            $bill->total_amount = $bill->total_amount - $expense->amount + $request->amount;
            $bill->save();
        }

        $expense->update($request->only(['amount', 'expense_date']));

        return response()->json([
            'message' => 'Expense updated',
            'expense' => $expense->fresh('payer')
        ]);
    }

    public function destroy(Bill $bill, Expense $expense)
    {
        if (!$bill->isAccessibleBy(Auth::id()) || $expense->bill_id !== $bill->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $bill->total_amount -= $expense->amount;
        $bill->save();

        $expense->delete();

        return response()->json(['message' => 'Expense deleted']);
    }

    public function summary(Bill $bill)
    {
        if (!$bill->isAccessibleBy(Auth::id())) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $expenses = $bill->expenses;
        $total = $expenses->sum('amount');
        $sharePerPerson = $bill->people_count > 0 ? $total / $bill->people_count : 0;

        return response()->json([
            'total' => $total,
            'formatted_total' => '$' . number_format($total, 2),
            'share_per_person' => $sharePerPerson,
            'formatted_share' => '$' . number_format($sharePerPerson, 2),
            'expense_count' => $expenses->count(),
        ]);
    }
}