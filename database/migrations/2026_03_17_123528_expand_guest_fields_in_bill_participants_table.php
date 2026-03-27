<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bill_participants', function (Blueprint $table) {
            $table->string('guest_firstname', 100)->nullable()->after('guest_name');
            $table->string('guest_lastname', 100)->nullable()->after('guest_firstname');
            $table->string('guest_email', 255)->nullable()->after('guest_lastname');
        });

        // Migrate existing guest_name data into guest_firstname
        \DB::table('bill_participants')
            ->whereNotNull('guest_name')
            ->update(['guest_firstname' => \DB::raw('guest_name')]);

        Schema::table('bill_participants', function (Blueprint $table) {
            $table->dropColumn('guest_name');
        });
    }

    public function down(): void
    {
        Schema::table('bill_participants', function (Blueprint $table) {
            $table->string('guest_name', 100)->nullable()->after('is_active');
        });

        \DB::table('bill_participants')
            ->whereNotNull('guest_firstname')
            ->update(['guest_name' => \DB::raw("CONCAT(guest_firstname, ' ', COALESCE(guest_lastname, ''))")]);

        Schema::table('bill_participants', function (Blueprint $table) {
            $table->dropColumn(['guest_firstname', 'guest_lastname', 'guest_email']);
        });
    }
};
