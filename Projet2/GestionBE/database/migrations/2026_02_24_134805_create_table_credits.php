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
        Schema::create('credits', function (Blueprint $table) {
            $table->id('id_credit');
            $table->decimal('montant_credit', 10, 2);
            $table->date('date_credit');
            $table->integer('nbr_mois');
            $table->decimal('taux_interet', 5, 2);
            $table->decimal('mensualite', 10, 2);
            $table->string('statut')->default('en_attente');
            $table->decimal('monatant_total', 10, 2);

            $table->foreignId('id_employe')->constrained('employes')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credits');
    }
};
