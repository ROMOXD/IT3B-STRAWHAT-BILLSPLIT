<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->string('expense_name')->after('bill_id');
            $table->enum('split_type', ['equal', 'custom'])->default('equal')->after('amount');
            // Allow guest payer: make paid_by nullable and add guest_paid_by
            $table->unsignedBigInteger('paid_by')->nullable()->change();
            $table->unsignedBigInteger('guest_paid_by')->nullable()->after('paid_by');
            $table->foreign('guest_paid_by')->references('id')->on('bill_participants')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropForeign(['guest_paid_by']);
            $table->dropColumn(['expense_name', 'split_type', 'guest_paid_by']);
            $table->unsignedBigInteger('paid_by')->nullable(false)->change();
        });
    }
};
