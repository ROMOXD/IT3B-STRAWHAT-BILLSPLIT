<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->index('status');
        });

        Schema::table('bill_participants', function (Blueprint $table) {
            $table->index('guest_email');
            $table->index(['bill_id', 'is_active']);
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->index(['bill_id', 'expense_date']);
        });
    }

    public function down(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->dropIndex(['status']);
        });

        Schema::table('bill_participants', function (Blueprint $table) {
            $table->dropIndex(['guest_email']);
            $table->dropIndex(['bill_id', 'is_active']);
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropIndex(['bill_id', 'expense_date']);
        });
    }
};
