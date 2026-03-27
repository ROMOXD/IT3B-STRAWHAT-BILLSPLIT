<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory;

    protected $table = 'expenses';

    protected $fillable = [
        'bill_id',
        'expense_name',
        'paid_by',
        'guest_paid_by',
        'amount',
        'split_type',
        'split_with',
        'expense_date',
    ];

    protected $casts = [
        'amount'       => 'decimal:2',
        'expense_date' => 'date',
        'split_with'   => 'array',
    ];

    public function bill()
    {
        return $this->belongsTo(Bill::class);
    }

    public function payer()
    {
        return $this->belongsTo(User::class, 'paid_by');
    }

    public function guestPayer()
    {
        return $this->belongsTo(BillParticipant::class, 'guest_paid_by');
    }

    public function getPayerNameAttribute(): string
    {
        if ($this->payer) {
            return $this->payer->firstname . ' ' . $this->payer->lastname;
        }
        if ($this->guestPayer) {
            $name = trim(($this->guestPayer->guest_firstname ?? '') . ' ' . ($this->guestPayer->guest_lastname ?? ''));
            return $name ?: 'Guest';
        }
        return 'Unknown';
    }
}
