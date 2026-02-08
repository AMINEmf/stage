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
        Schema::create('declarations_cnss', function (Blueprint $table) {
            $table->id();
            $table->foreignId('departement_id')->constrained('departements');
            $table->integer('mois');
            $table->integer('annee');
            $table->decimal('montant_total', 12, 2);
            $table->enum('statut', ['BROUILLON', 'VALIDEE', 'ENVOYEE'])->default('BROUILLON');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('declarations_cnss');
    }
};

