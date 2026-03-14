<?php
// app/Http/Controllers/BillController.php

namespace App\Http\Controllers;

use App\Models\Bill;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia; // Add this import

class BillController extends Controller
{
    /**
     * Display a listing of the user's bills.
     */
    public function index()
    {
        $user = Auth::user();
        
        $bills = Bill::with(['host', 'participants.user'])
                    ->forUser($user->id)
                    ->active()
                    ->latest()
                    ->get();
        
        $archivedBills = Bill::with(['host', 'participants.user'])
                            ->forUser($user->id)
                            ->archived()
                            ->latest()
                            ->get();
        
        // Return Inertia view instead of Blade
        return Inertia::render('Dashboard', [
            'bills' => $bills,
            'archivedBills' => $archivedBills
        ]);
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
        
        // Get users for participant selection
        $users = User::where('id', '!=', $user->id)
            ->select('id', 'firstname', 'lastname', 'email')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->firstname . ' ' . $user->lastname,
                    'email' => $user->email
                ];
            });
        
        return Inertia::render('Bills/Create', [
            'users' => $users
        ]);
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
            'amount' => 'required|numeric|min:0'
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
        $peopleCount = 1 + count($request->participants ?? []);
        // Create bill
        $bill = Bill::create([
            'billname' => $request->billname,
            'hostid' => $user->id,
             'total_amount' => $request->amount,
        'people_count' => $peopleCount,
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
        
        // Redirect to bills index (Dashboard)
        return redirect()->route('dashboard')
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
        
        // Load relationships
        $bill->load(['host', 'participants.user', 'expenses.payer']);
        
        // Return Inertia view
        return Inertia::render('Bills/Show', [
            'bill' => $bill
        ]);
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
        
        // Get users for participant selection
        $users = User::where('id', '!=', Auth::id())
            ->select('id', 'firstname', 'lastname', 'email')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->firstname . ' ' . $user->lastname,
                    'email' => $user->email
                ];
            });
        
        return Inertia::render('Bills/Edit', [
            'bill' => $bill->load('participants.user'),
            'users' => $users
        ]);
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

    // ... rest of your methods (archive, reactivate, destroy, etc.)
    
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
}   