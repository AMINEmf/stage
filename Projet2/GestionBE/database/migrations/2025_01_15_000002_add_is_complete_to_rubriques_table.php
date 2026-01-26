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
        Schema::table('rubriques', function (Blueprint $table) {
            $table->boolean('is_complete')->default(false)->after('memo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rubriques', function (Blueprint $table) {
            $table->dropColumn('is_complete');
        });
    }
}; 