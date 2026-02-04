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
        Schema::create('cimr_declarations', function (Blueprint $table) {
            $table->id();
            $table->string('employe');
            $table->string('matricule');
            $table->unsignedBigInteger('departement_id')->nullable();
            
            // Declaration fields
            $table->integer('mois'); // 1-12
            $table->integer('annee');
            $table->decimal('montant_cimr_employeur', 10, 2)->nullable();
            
            // Status: 'a_declarer', 'declare', 'paye'
            $table->enum('statut', ['a_declarer', 'declare', 'paye'])->default('a_declarer');

            $table->timestamps();

            $table->foreign('departement_id')->references('id')->on('departements')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cimr_declarations');
    }
};
