<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'firstname',
        'lastname',
        'username',
        'email',
        'usertype',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Get the bills where the user is the host.
     */
    public function hostedBills()
    {
        return $this->hasMany(Bill::class, 'hostid');
    }

    /**
     * Get the bills where the user is a participant.
     */
    public function participantBills()
    {
        return $this->belongsToMany(Bill::class, 'bill_participants', 'user_id', 'bill_id')
                    ->withPivot('is_active')
                    ->withTimestamps();
    }

    /**
     * Check if user can create a new bill based on their subscription limits
     */
    public function canCreateBill(): bool
    {
        // For premium users - no limit
        if ($this->usertype === 'standard') {
            return true;
        }
        
        // For standard users - check monthly limit (e.g., 5 bills per month)
        $monthlyBillCount = $this->hostedBills()
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();
        
        return $monthlyBillCount < 5; // Adjust limit as needed
    }

    /**
     * Increment user's bill count (if tracking separately)
     */
    public function incrementBillCount(): void
    {
        // If you have a monthly_bill_count field, you could increment it here
        // $this->increment('monthly_bill_count');
        
        // For now, we don't need to do anything since we're querying directly
        // This method exists because your controller calls it
    }
}