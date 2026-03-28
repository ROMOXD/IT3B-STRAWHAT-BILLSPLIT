<?php

use App\Http\Controllers\BillController;
use App\Http\Controllers\EmailVerificationCodeController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\GuestController;
use App\Http\Controllers\PasswordResetCodeController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::middleware(['guest', \App\Http\Middleware\PreventBackHistory::class])->group(function () {
    Route::post('/password/code/send', [PasswordResetCodeController::class, 'send'])->name('password.code.send');
    Route::post('/password/code/verify', [PasswordResetCodeController::class, 'verify'])->name('password.code.verify');
    Route::post('/password/code/reset', [PasswordResetCodeController::class, 'reset'])->name('password.code.reset');
    Route::post('/password/code/cancel', [PasswordResetCodeController::class, 'cancel'])->name('password.code.cancel');
});

Route::middleware('auth')->group(function () {
    Route::post('/email/verification-code/send', [EmailVerificationCodeController::class, 'send'])->name('verification.code.send');
    Route::post('/email/verification-code/verify', [EmailVerificationCodeController::class, 'verify'])->name('verification.code.verify');
});

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

// Guest bill lookup (no auth required)
Route::get('/guest/lookup', [GuestController::class, 'showLookup'])->name('guest.lookup');
Route::post('/guest/lookup', [GuestController::class, 'lookup'])->name('guest.lookup.post');
Route::post('/guest/register', [GuestController::class, 'register'])->name('guest.register');
Route::post('/guest/login', [GuestController::class, 'loginGuest'])->name('guest.login');
Route::get('/guest/otp', [GuestController::class, 'showOtp'])->name('guest.otp');
Route::post('/guest/otp', [GuestController::class, 'verifyOtp'])->name('guest.otp.verify');


Route::middleware(['auth'])->group(function () {
    Route::post('/guest/upgrade', [GuestController::class, 'upgrade'])->name('guest.upgrade');
});

Route::middleware(['auth', 'verified', \App\Http\Middleware\PreventBackHistory::class])->group(function () {

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
    Route::patch('/bills/{bill}/expenses/{expense}', [ExpenseController::class, 'updateName'])->name('expenses.update-name');
    Route::delete('/bills/{bill}/expenses/{expense}', [ExpenseController::class, 'destroy'])->name('expenses.destroy');
});

require __DIR__.'/settings.php';
