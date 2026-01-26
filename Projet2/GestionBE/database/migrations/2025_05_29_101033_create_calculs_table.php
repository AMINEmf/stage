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
        Schema::create('calculs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('rubrique_id'); // Clé étrangère vers rubriques
            $table->string('type_calcul')->nullable(); // Type de calcul (Nombre x Base, etc.)
            $table->string('gain')->nullable(); // retenue/gain
            $table->text('formule')->nullable(); // Formule générée automatiquement
            
            // Champs pour les valeurs de formule
            $table->string('formule_nombre')->nullable(); // Valeur ou code constante pour Nombre
            $table->string('formule_base')->nullable(); // Valeur ou code constante pour Base
            $table->string('formule_taux')->nullable(); // Valeur ou code constante pour Taux
            $table->string('formule_montant')->nullable(); // Valeur ou code constante pour Montant
            
            // Champs booléens pour Report, Impression, Saisie
            $table->boolean('report_nombre')->default(false);
            $table->boolean('report_base')->default(false);
            $table->boolean('report_taux')->default(false);
            $table->boolean('report_montant')->default(false);
            
            $table->boolean('impression_nombre')->default(false);
            $table->boolean('impression_base')->default(false);
            $table->boolean('impression_taux')->default(false);
            $table->boolean('impression_montant')->default(false);
            
            $table->boolean('saisie_nombre')->default(false);
            $table->boolean('saisie_base')->default(false);
            $table->boolean('saisie_taux')->default(false);
            $table->boolean('saisie_montant')->default(false);
            
            $table->timestamps();

            // Index et contrainte de clé étrangère
            $table->foreign('rubrique_id')->references('id')->on('rubriques')->onDelete('cascade');
            $table->index('rubrique_id');
            $table->index('type_calcul');
            $table->index('gain');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('calculs');
    }
};