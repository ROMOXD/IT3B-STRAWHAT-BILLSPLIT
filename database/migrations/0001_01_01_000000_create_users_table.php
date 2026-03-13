<?php
// database/migrations/2014_10_12_000000_create_users_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('firstname');
            $table->string('lastname');
            $table->string('username')->unique();
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            
            // User Type (Essential for your spec)
            $table->enum('usertype', ['guest', 'standard', 'premium'])
                  ->default('standard'); // Self-registered users start as standard
            
            // Guest specific fields (only used if user_type = 'guest')
            $table->string('invitation_code')->nullable(); // Code they used to join
            $table->timestamp('guest_access_expires_at')->nullable(); // 6hr limit
            
            // Standard/Premium fields
            $table->integer('bills_created_this_month')->default(0);
            $table->date('last_bill_reset_date')->nullable();
            
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};