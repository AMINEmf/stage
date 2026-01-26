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
        Schema::create('types_calculs', function (Blueprint $table) {
            $table->id();
            
            // Nom du type de calcul
            $table->string('designation')->unique(); // "Nombre x Base", "Base x Taux", etc.
            
            // Modèle de formule
            $table->string('modele_formule'); // "{nombre} × {base}", "{base} × {taux}%", etc.
            
            // Champs requis pour ce type de calcul
            $table->json('champs_requis'); // ["nombre", "base"] ou ["base", "taux"], etc.
            
            // Description du calcul
            $table->text('description')->nullable();
            
            // Exemples d'utilisation
            $table->text('exemple')->nullable();
            
            // Ordre d'affichage dans la liste
            $table->integer('ordre')->default(0);
            
            // État actif/inactif
            $table->boolean('is_active')->default(true);
            
            // Catégorie du calcul
            $table->string('categorie')->default('standard'); // standard, avance, special
            
            $table->timestamps();
            
            // Index
            $table->index(['is_active', 'ordre']);
            $table->index('categorie');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('types_calculs');
    }
}; 