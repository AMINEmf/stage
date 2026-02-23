<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('accident_types')) {
            Schema::create('accident_types', function (Blueprint $table) {
                $table->id();
                $table->string('nom')->unique();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('accident_natures')) {
            Schema::create('accident_natures', function (Blueprint $table) {
                $table->id();
                $table->string('nom')->unique();
                $table->timestamps();
            });
        }

        Schema::table('accidents', function (Blueprint $table) {
            if (!Schema::hasColumn('accidents', 'accident_type_id')) {
                $table->foreignId('accident_type_id')->nullable()->constrained('accident_types')->nullOnDelete();
            }
            if (!Schema::hasColumn('accidents', 'accident_nature_id')) {
                $table->foreignId('accident_nature_id')->nullable()->constrained('accident_natures')->nullOnDelete();
            }
        });

        // Drop the old type_accident column if it exists
        if (Schema::hasColumn('accidents', 'type_accident')) {
            Schema::table('accidents', function (Blueprint $table) {
                $table->dropColumn('type_accident');
            });
        }
    }

    public function down(): void
    {
        Schema::table('accidents', function (Blueprint $table) {
            $table->dropForeign(['accident_type_id']);
            $table->dropForeign(['accident_nature_id']);
            $table->dropColumn('accident_type_id');
            $table->dropColumn('accident_nature_id');
            $table->string('type_accident')->nullable();
        });

        Schema::dropIfExists('accident_natures');
        Schema::dropIfExists('accident_types');
    }
};
