<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bill_participants', function (Blueprint $table) {
            $table->string('guest_nickname', 100)->nullable()->after('guest_lastname');
        });
    }

    public function down(): void
    {
        Schema::table('bill_participants', function (Blueprint $table) {
            $table->dropColumn('guest_nickname');
        });
    }
};
