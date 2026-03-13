<?php
// database/migrations/2024_01_01_000002_create_bill_participants_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bill_participants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bill_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Minimal guest info
            $table->string('guest_name', 100)->nullable();
            
            // Indexes
            $table->index('bill_id');
            $table->index('user_id');
            $table->unique(['bill_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bill_participants');
    }
};