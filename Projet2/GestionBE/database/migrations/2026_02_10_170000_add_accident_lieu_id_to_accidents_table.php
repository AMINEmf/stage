<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accidents', function (Blueprint $table) {
            if (!Schema::hasColumn('accidents', 'accident_lieu_id')) {
                $table->foreignId('accident_lieu_id')->nullable()->constrained('accident_lieux')->nullOnDelete();
            }
            if (Schema::hasColumn('accidents', 'lieu')) {
                $table->dropColumn('lieu');
            }
        });
    }

    public function down(): void
    {
        Schema::table('accidents', function (Blueprint $table) {
            $table->string('lieu')->nullable();
            $table->dropForeign(['accident_lieu_id']);
            $table->dropColumn('accident_lieu_id');
        });
    }
};
