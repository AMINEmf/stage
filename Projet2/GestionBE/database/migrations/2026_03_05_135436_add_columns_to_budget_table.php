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
        Schema::table('budget', function (Blueprint $table) {
            $table->decimal("budget_creditInterne",10,2);
            $table->decimal("totalCredit_actif",10,2);
            $table->decimal("montant_disponible",10,2);
            $table->decimal("taux_endettement",5,2);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('budget', function (Blueprint $table) {
            $table->dropColumn('budget_creditInterne');
            $table->dropColumn('totalCredit_actif');
            $table->dropColumn('montant_disponible');
            $table->dropColumn('taux_endettement');
        });
    }
};
