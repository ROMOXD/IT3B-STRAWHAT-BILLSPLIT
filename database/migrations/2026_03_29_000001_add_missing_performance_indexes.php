<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->index('hostid');
            $table->index(['hostid', 'created_at']);
        });

        Schema::table('bill_participants', function (Blueprint $table) {
            $table->index(['user_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->dropIndex(['hostid']);
            $table->dropIndex(['hostid', 'created_at']);
        });

        Schema::table('bill_participants', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'is_active']);
        });
    }
};
