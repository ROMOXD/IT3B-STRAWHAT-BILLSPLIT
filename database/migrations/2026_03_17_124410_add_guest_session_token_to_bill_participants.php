<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bill_participants', function (Blueprint $table) {
            $table->string('guest_token', 64)->nullable()->unique()->after('guest_email');
            $table->timestamp('guest_expires_at')->nullable()->after('guest_token');
        });
    }

    public function down(): void
    {
        Schema::table('bill_participants', function (Blueprint $table) {
            $table->dropColumn(['guest_token', 'guest_expires_at']);
        });
    }
};
