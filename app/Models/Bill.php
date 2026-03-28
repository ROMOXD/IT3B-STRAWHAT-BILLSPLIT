<?php
// app/Models/Bill.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Bill extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'bills';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'billname',
        'invitation_code',
        'hostid',
        'status',
        'total_amount',
        'people_count'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'total_amount' => 'decimal:2',
        'people_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    /**
     * The model's default values for attributes.
     *
     * @var array
     */
    protected $attributes = [
        'status' => 'active',
        'total_amount' => 0,
        'people_count' => 1
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        // Automatically generate invitation code when creating a new bill
        static::creating(function ($bill) {
            if (empty($bill->invitation_code)) {
                $bill->invitation_code = self::generateUniqueInvitationCode();
            }
        });

        // Activity logging removed - not needed for core functionality
    }

    /**
     * Generate a unique invitation code.
     */
    public static function generateUniqueInvitationCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (static::where('invitation_code', $code)->exists());

        return $code;
    }

    // ==================== RELATIONSHIPS ====================

    /**
     * Get the host (owner) of the bill.
     */
    public function host()
    {
        return $this->belongsTo(User::class, 'hostid');
    }

    /**
     * Get all participants of the bill.
     */
    public function participants()
    {
        return $this->hasMany(BillParticipant::class, 'bill_id');
    }

    /**
     * Get all registered users participating in this bill.
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'bill_participants', 'bill_id', 'user_id')
                    ->withPivot('is_active')
                    ->withTimestamps();
    }

    /**
     * Get all expenses for this bill.
     */
    public function expenses()
    {
        return $this->hasMany(Expense::class, 'bill_id');
    }

    // ==================== SCOPES ====================

    /**
     * Scope a query to only include active bills.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope a query to only include archived bills.
     */
    public function scopeArchived($query)
    {
        return $query->where('status', 'archived');
    }

    /**
     * Scope a query to filter by host.
     */
    public function scopeHostedBy($query, $userId)
    {
        return $query->where('hostid', $userId);
    }

    /**
     * Scope a query to get bills for a user (as host or participant).
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('hostid', $userId)
              ->orWhereIn('id', function ($sub) use ($userId) {
                  $sub->select('bill_id')
                      ->from('bill_participants')
                      ->where('user_id', $userId)
                      ->where('is_active', true);
              });
        });
    }

    // ==================== ACCESSORS ====================

    /**
     * Get the bill name with proper capitalization.
     */
    public function getFormattedBillnameAttribute(): string
    {
        return ucwords($this->billname);
    }

    /**
     * Get the status label.
     */
    public function getStatusLabelAttribute(): string
    {
        return ucfirst($this->status);
    }

    /**
     * Get formatted total amount.
     */
    public function getFormattedTotalAttribute(): string
    {
        return '$ ' . number_format($this->total_amount, 2);
    }

    /**
     * Get the host's name.
     */
    public function getHostNameAttribute(): string
    {
        return $this->host ? $this->host->firstname . ' ' . $this->host->lastname : 'Unknown';
    }

    /**
     * Get the invitation URL.
     */
    public function getInvitationUrlAttribute(): string
    {
        return route('bills.join', ['code' => $this->invitation_code]);
    }

    /**
     * Check if the bill is editable.
     */
    public function getIsEditableAttribute(): bool
    {
        return $this->status === 'active';
    }

    // ==================== CUSTOM METHODS ====================

    /**
     * Regenerate the invitation code.
     */
    public function regenerateInvitationCode(): string
    {
        $oldCode = $this->invitation_code;
        $newCode = self::generateUniqueInvitationCode();
        
        $this->invitation_code = $newCode;
        $this->save();
        
        return $newCode;
    }

    /**
     * Add a participant to the bill.
     */
    public function addParticipant($userId, $addedBy = null)
    {
        if ($this->participants()->where('user_id', $userId)->where('is_active', true)->exists()) {
            return false;
        }

        if ($this->host && $this->host->usertype === 'standard') {
            $actualCount = $this->participants()->where('is_active', true)->count();
            if ($actualCount >= 3) {
                throw new \Exception('Standard users can only have up to 3 people per bill.');
            }
        }

        $participant = $this->participants()->create([
            'bill_id'  => $this->id,
            'user_id'  => $userId,
            'is_active' => true,
        ]);

        $this->increment('people_count');

        return $participant;
    }

    /**
     * Add a guest participant to the bill.
     */
    public function addGuestParticipant($guestName, $guestEmail = null, $addedBy = null)
    {
        // Check limits for standard users
        if ($this->host && $this->host->usertype === 'standard' && $this->people_count >= 3) {
            throw new \Exception('Standard users can only have up to 3 people per bill');
        }
        
        $participant = $this->participants()->create([
            'bill_id' => $this->id,
            'user_id' => null,
            'guest_name' => $guestName,
            'guest_email' => $guestEmail,
            'added_by' => $addedBy ?? auth()->id() ?? $this->hostid,
            'is_active' => true
        ]);
        
        // Update people count
        $this->increment('people_count');
        
        return $participant;
    }

    /**
     * Remove a participant from the bill.
     */
    public function removeParticipant($userId, $removedBy = null)
    {
        $participant = $this->participants()
                            ->where('user_id', $userId)
                            ->where('is_active', true)
                            ->first();
        
        if ($participant) {
            $participant->update([
                'is_active' => false,
                'removed_at' => now(),
                'removed_by' => $removedBy ?? auth()->id()
            ]);
            
            $this->decrement('people_count');
        }
        
        return $participant;
    }

    /**
     * Calculate the total amount from expenses.
     */
    public function calculateTotalAmount(): float
    {
        $total = $this->expenses()->sum('amount');
        
        $this->update(['total_amount' => $total]);
        
        return $total;
    }

    /**
     * Archive the bill.
     */
    public function archive(): bool
    {
        return $this->update(['status' => 'archived']);
    }

    /**
     * Reactivate an archived bill.
     */
    public function reactivate(): bool
    {
        return $this->update(['status' => 'active']);
    }

    /**
     * Check if user can access this bill.
     */
    public function isAccessibleBy($userId): bool
    {
        return $this->hostid == $userId || 
               $this->participants()
                    ->where('user_id', $userId)
                    ->where('is_active', true)
                    ->exists();
    }

    /**
     * Check if user is the host.
     */
    public function isHostedBy($userId): bool
    {
        return $this->hostid == $userId;
    }
}