<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    protected $fillable = [
        'firstname',
        'lastname',
        'nickname',
        'username',
        'email',
        'usertype',
        'password',
        'guest_access_expires_at',
        'invitation_code',
    ];

    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at'        => 'datetime',
            'guest_access_expires_at'  => 'datetime',
            'password'                 => 'hashed',
            'two_factor_confirmed_at'  => 'datetime',
        ];
    }

    public function hostedBills()
    {
        return $this->hasMany(Bill::class, 'hostid');
    }

    public function participantBills()
    {
        return $this->belongsToMany(Bill::class, 'bill_participants', 'user_id', 'bill_id')
                    ->withPivot('is_active')
                    ->withTimestamps();
    }

    public function canCreateBill(): bool
    {
        if ($this->usertype === 'premium') {
            return true;
        }

        // Standard: max 5 bills per month
        $count = $this->hostedBills()
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        return $count < 5;
    }

    public function isGuestAccessExpired(): bool
    {
        if ($this->usertype !== 'guest') {
            return false;
        }

        return $this->guest_access_expires_at && now()->isAfter($this->guest_access_expires_at);
    }
}
