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
        Schema::table('cnss_documents', function (Blueprint $table) {
            $table->foreignId('operation_id')
                ->nullable()
                ->after('employe_id')
                ->constrained('cnss_operations')
                ->cascadeOnDelete();

            $table->index('operation_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cnss_documents', function (Blueprint $table) {
            $table->dropForeign(['operation_id']);
            $table->dropIndex(['operation_id']);
            $table->dropColumn('operation_id');
        });
    }
};
