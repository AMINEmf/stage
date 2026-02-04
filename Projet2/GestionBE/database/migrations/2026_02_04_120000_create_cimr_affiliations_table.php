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
        if (!Schema::hasTable('cimr_affiliations')) {
            Schema::create('cimr_affiliations', function (Blueprint $table) {
                $table->id();
                $table->string('employe');
                $table->string('matricule');
                $table->unsignedBigInteger('departement_id')->nullable();
                $table->boolean('affilie_cimr')->default(false);
                $table->string('numero_cimr')->nullable();
                $table->date('date_affiliation')->nullable();
                $table->decimal('salaire_cotisable', 10, 2)->nullable();
                $table->decimal('taux_employeur', 5, 2)->nullable();
                $table->enum('statut', ['actif', 'suspendu'])->default('actif');
                $table->timestamps();

                $table->foreign('departement_id')->references('id')->on('departements')->onDelete('set null');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cimr_affiliations');
    }
};
