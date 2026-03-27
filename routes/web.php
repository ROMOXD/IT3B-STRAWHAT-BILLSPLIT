<?php

use App\Http\Controllers\BillController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\GuestController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

// Guest bill lookup (no auth required)
Route::get('/guest/lookup', [GuestController::class, 'showLookup'])->name('guest.lookup');
Route::post('/guest/lookup', [GuestController::class, 'lookup'])->name('guest.lookup.post');
Route::post('/guest/register', [GuestController::class, 'register'])->name('guest.register');
Route::get('/guest/bill/{bill}', [GuestController::class, 'showBill'])->name('guest.bill');
Route::post('/guest/upgrade', [GuestController::class, 'upgrade'])->name('guest.upgrade');
Route::get('/guest/claim', [GuestController::class, 'claimGuestEntries'])->name('guest.claim')->middleware(['auth', 'verified']);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [BillController::class, 'index'])->name('dashboard');

    Route::resource('bills', BillController::class);
    Route::patch('/bills/{bill}/archive', [BillController::class, 'archive'])->name('bills.archive');
    Route::patch('/bills/{bill}/unarchive', [BillController::class, 'unarchive'])->name('bills.unarchive');
    Route::post('/bills/{bill}/regenerate-code', [BillController::class, 'regenerateCode'])->name('bills.regenerate-code');
    Route::post('/bills/{bill}/add-participant', [BillController::class, 'addParticipant'])->name('bills.add-participant');
    Route::delete('/bills/{bill}/participants/{participant}', [BillController::class, 'removeParticipant'])->name('bills.remove-participant');

    Route::get('/bills/{bill}/expenses', [ExpenseController::class, 'index'])->name('expenses.index');
    Route::post('/bills/{bill}/expenses', [ExpenseController::class, 'store'])->name('expenses.store');
    Route::put('/bills/{bill}/expenses/{expense}', [ExpenseController::class, 'update'])->name('expenses.update');
    Route::delete('/bills/{bill}/expenses/{expense}', [ExpenseController::class, 'destroy'])->name('expenses.destroy');
});

require __DIR__.'/settings.php';
