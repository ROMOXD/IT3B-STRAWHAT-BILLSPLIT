<?php
// app/Models/BillParticipant.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BillParticipant extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'bill_participants';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'bill_id',
        'user_id',
        'is_active',
        'guest_name',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The model's default values for attributes.
     *
     * @var array
     */
    protected $attributes = [
        'is_active' => true,
    ];

    // ==================== RELATIONSHIPS ====================

    /**
     * Get the bill that this participant belongs to.
     */
    public function bill(): BelongsTo
    {
        return $this->belongsTo(Bill::class, 'bill_id');
    }

    /**
     * Get the user that this participant belongs to (if registered).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // ==================== SCOPES ====================

    /**
     * Scope a query to only include active participants.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include registered users.
     */
    public function scopeRegistered($query)
    {
        return $query->whereNotNull('user_id');
    }

    /**
     * Scope a query to only include guests.
     */
    public function scopeGuests($query)
    {
        return $query->whereNull('user_id');
    }

    // ==================== ACCESSORS ====================

    /**
     * Get the participant's display name.
     */
    public function getDisplayNameAttribute(): string
    {
        if ($this->user) {
            return $this->user->firstname . ' ' . $this->user->lastname;
        }
        
        return $this->guest_name ?? 'Unknown Guest';
    }

    /**
     * Check if this participant is a guest.
     */
    public function getIsGuestAttribute(): bool
    {
        return is_null($this->user_id);
    }

    /**
     * Check if this participant is a registered user.
     */
    public function getIsRegisteredAttribute(): bool
    {
        return !is_null($this->user_id);
    }

    // ==================== CUSTOM METHODS ====================

    /**
     * Mark participant as inactive.
     */
    public function deactivate(): bool
    {
        return $this->update(['is_active' => false]);
    }

    /**
     * Reactivate participant.
     */
    public function reactivate(): bool
    {
        return $this->update(['is_active' => true]);
    }
}