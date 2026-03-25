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
        Schema::table('credits', function (Blueprint $table) {
            $table->renameColumn('Monatant_total', 'montant_total');
            $table->renameColumn('mensualité', 'mensualite');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('credits', function (Blueprint $table) {
            $table->renameColumn('montant_total', 'Monatant_total');
            $table->renameColumn('mensualite', 'mensualité');
        });
    }
};
