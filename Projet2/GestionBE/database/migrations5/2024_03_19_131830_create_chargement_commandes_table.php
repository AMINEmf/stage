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
        Schema::create('chargement_commandes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('vehicule_id');
            $table->foreign('vehicule_id')->references('id')->on('vehicules');
            $table->string('conforme');
            $table->string('statusChargemant');

            $table->string('remarque')->nullable();
            $table->unsignedBigInteger('livreur_id');
            $table->foreign('livreur_id')->references('id')->on('livreurs');
            $table->unsignedBigInteger('commande_id');
            $table->foreign('commande_id')->references('id')->on('commandes');
            $table->date('dateLivraisonPrevue');
            $table->date('dateLivraisonReelle')->nullable();;
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chargement_commandes');
    }
};
