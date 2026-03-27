<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            // Stores JSON array of bill_participant IDs for custom splits
            // Use ->after() only if split_type exists (it's added by a prior migration)
            if (Schema::hasColumn('expenses', 'split_type')) {
                $table->json('split_with')->nullable()->after('split_type');
            } else {
                $table->json('split_with')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropColumn('split_with');
        });
    }
};
