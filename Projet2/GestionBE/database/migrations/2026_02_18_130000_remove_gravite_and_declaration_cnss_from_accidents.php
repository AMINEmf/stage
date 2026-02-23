<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accidents', function (Blueprint $table) {
            if (Schema::hasColumn('accidents', 'gravite')) {
                $table->dropColumn('gravite');
            }
            if (Schema::hasColumn('accidents', 'declaration_cnss')) {
                $table->dropColumn('declaration_cnss');
            }
        });
    }

    public function down(): void
    {
        Schema::table('accidents', function (Blueprint $table) {
            $table->enum('gravite', ['léger', 'moyen', 'grave'])->default('léger')->after('accident_lieu_id');
            $table->boolean('declaration_cnss')->default(false)->after('duree_arret');
        });
    }
};
