<?php
// app/Http/Controllers/BillController.php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class BillController extends Controller
{
    /**
     * Display a listing of the user's bills.
     */
    public function index()
    {
        $user = Auth::user();
        
        $bills = Bill::with(['host', 'participants'])
                    ->forUser($user->id)
                    ->active()
                    ->latest()
                    ->get();
        
        $archivedBills = Bill::with(['host', 'participants'])
                            ->forUser($user->id)
                            ->archived()
                            ->latest()
                            ->get();
        
        return view('bills.index', compact('bills', 'archivedBills'));
    }

    /**
     * Show the form for creating a new bill.
     */
    public function create()
    {
        // Check if user can create a bill
        $user = Auth::user();
        
        if (!$user->canCreateBill()) {
            return redirect()->back()
                ->with('error', 'You have reached your monthly bill limit.');
        }
        
        return view('bills.create');
    }

    /**
     * Store a newly created bill in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        // Check if user can create a bill
        if (!$user->canCreateBill()) {
            return response()->json([
                'success' => false,
                'message' => 'You have reached your monthly bill limit.'
            ], 403);
        }
        
        // Validate request
        $validator = Validator::make($request->all(), [
            'billname' => 'required|string|max:100',
        ]);
        
        if ($validator->fails()) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        // Create bill
        $bill = Bill::create([
            'billname' => $request->billname,
            'hostid' => $user->id,
            'invitation_code' => Bill::generateUniqueInvitationCode()
        ]);
        
        // Add host as participant
        $bill->addParticipant($user->id);
        
        // Increment user's bill count
        $user->incrementBillCount();
        
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Bill created successfully.',
                'bill' => $bill->load('host')
            ], 201);
        }
        
        return redirect()->route('bills.show', $bill->id)
            ->with('success', 'Bill created successfully.');
    }

    /**
     * Display the specified bill.
     */
    public function show(Bill $bill)
    {
        // Check if user can access this bill
        if (!$bill->isAccessibleBy(Auth::id())) {
            abort(403, 'Unauthorized access to this bill.');
        }
        
        $bill->load(['host', 'participants.user', 'expenses']);
        
        return view('bills.show', compact('bill'));
    }

    /**
     * Show the form for editing the specified bill.
     */
    public function edit(Bill $bill)
    {
        // Check if user is the host
        if (!$bill->isHostedBy(Auth::id())) {
            abort(403, 'Only the host can edit this bill.');
        }
        
        return view('bills.edit', compact('bill'));
    }

    /**
     * Update the specified bill in storage.
     */
    public function update(Request $request, Bill $bill)
    {
        // Check if user is the host
        if (!$bill->isHostedBy(Auth::id())) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Only the host can edit this bill.'
                ], 403);
            }
            abort(403, 'Only the host can edit this bill.');
        }
        
        // Validate request
        $validator = Validator::make($request->all(), [
            'billname' => 'sometimes|required|string|max:100',
            'status' => 'sometimes|in:active,archived'
        ]);
        
        if ($validator->fails()) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors()
                ], 422);
            }
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        // Update bill
        $bill->update($request->only(['billname', 'status']));
        
        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Bill updated successfully.',
                'bill' => $bill
            ]);
        }
        
        return redirect()->route('bills.show', $bill->id)
            ->with('success', 'Bill updated successfully.');
    }

    /**
     * Archive the specified bill.
     */
    public function archive(Bill $bill)
    {
        // Check if user is the host
        if (!$bill->isHostedBy(Auth::id())) {
            return response()->json([
                'success' => false,
                'message' => 'Only the host can archive this bill.'
            ], 403);
        }
        
        $bill->archive();
        
        return response()->json([
            'success' => true,
            'message' => 'Bill archived successfully.'
        ]);
    }

    /**
     * Reactivate an archived bill.
     */
    public function reactivate(Bill $bill)
    {
        // Check if user is the host
        if (!$bill->isHostedBy(Auth::id())) {
            return response()->json([
                'success' => false,
                'message' => 'Only the host can reactivate this bill.'
            ], 403);
        }
        
        $bill->reactivate();
        
        return response()->json([
            'success' => true,
            'message' => 'Bill reactivated successfully.'
        ]);
    }

    /**
     * Remove the specified bill from storage.
     */
    public function destroy(Bill $bill)
    {
        // Check if user is the host
        if (!$bill->isHostedBy(Auth::id())) {
            return response()->json([
                'success' => false,
                'message' => 'Only the host can delete this bill.'
            ], 403);
        }
        
        $bill->delete();
        
        return response()->json([
            'success' => true,
            'message' => 'Bill deleted successfully.'
        ]);
    }

    /**
     * Regenerate invitation code.
     */
    public function regenerateInvitationCode(Bill $bill)
    {
        // Check if user is the host
        if (!$bill->isHostedBy(Auth::id())) {
            return response()->json([
                'success' => false,
                'message' => 'Only the host can regenerate the invitation code.'
            ], 403);
        }
        
        $newCode = $bill->regenerateInvitationCode();
        
        return response()->json([
            'success' => true,
            'message' => 'Invitation code regenerated successfully.',
            'invitation_code' => $newCode
        ]);
    }

    /**
     * Join a bill via invitation code.
     */
    public function join(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'invitation_code' => 'required|string|exists:bills,invitation_code'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }
        
        $bill = Bill::where('invitation_code', $request->invitation_code)
                    ->active()
                    ->first();
        
        if (!$bill) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired invitation code.'
            ], 404);
        }
        
        $user = Auth::user();
        
        // Check if already a participant
        if ($bill->participants()->where('user_id', $user->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'You are already a participant in this bill.'
            ], 400);
        }
        
        // Check limits for standard users
        if ($bill->host->usertype === 'standard' && $bill->people_count >= 3) {
            return response()->json([
                'success' => false,
                'message' => 'This bill has reached the maximum number of participants.'
            ], 400);
        }
        
        $bill->addParticipant($user->id);
        
        return response()->json([
            'success' => true,
            'message' => 'Successfully joined the bill.',
            'bill' => $bill->fresh(['host', 'participants'])
        ]);
    }

    /**
     * Get bill summary (for API).
     */
    public function summary(Bill $bill)
    {
        // Check if user can access this bill
        if (!$bill->isAccessibleBy(Auth::id())) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.'
            ], 403);
        }
        
        $bill->load(['host', 'participants.user', 'expenses']);
        
        $summary = [
            'id' => $bill->id,
            'billname' => $bill->billname,
            'invitation_code' => $bill->invitation_code,
            'host' => [
                'id' => $bill->host->id,
                'name' => $bill->host->firstname . ' ' . $bill->host->lastname
            ],
            'status' => $bill->status,
            'total_amount' => $bill->total_amount,
            'formatted_total' => $bill->formatted_total,
            'people_count' => $bill->people_count,
            'participants' => $bill->participants->map(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->user ? 
                             $p->user->firstname . ' ' . $p->user->lastname : 
                             $p->guest_name,
                    'is_guest' => is_null($p->user_id),
                    'is_active' => $p->is_active
                ];
            }),
            'expense_count' => $bill->expenses->count(),
            'created_at' => $bill->created_at->format('Y-m-d H:i:s'),
            'invitation_url' => $bill->invitation_url
        ];
        
        return response()->json([
            'success' => true,
            'data' => $summary
        ]);
    }
}