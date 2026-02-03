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
        Schema::create('cnss_affiliations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employe_id');
            $table->string('numero_cnss');
            $table->decimal('salaire', 10, 2);
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->enum('statut', ['Actif', 'Inactif', 'Suspendu'])->default('Actif');
            $table->unsignedBigInteger('departement_id')->nullable();
            $table->timestamps();

            // Foreign keys
            $table->foreign('employe_id')->references('id')->on('employes')->onDelete('cascade');
            $table->foreign('departement_id')->references('id')->on('departements')->onDelete('set null');
            
            // Index pour optimiser les recherches
            $table->index('employe_id');
            $table->index('statut');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cnss_affiliations');
    }
};
