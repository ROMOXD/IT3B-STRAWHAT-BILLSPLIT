<?php


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bills', function (Blueprint $table) {
            $table->id();
            $table->string('billname', 100);
            $table->string('invitation_code', 20)->unique();
            $table->foreignId('hostid')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['active', 'archived'])->default('active');
            $table->decimal('total_amount', 10, 2)->default(0);
            $table->integer('people_count')->default(1);
            $table->timestamps();
            $table->softDeletes();
            
            $table->index('hostid');
            $table->index('invitation_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bills');
    }
};