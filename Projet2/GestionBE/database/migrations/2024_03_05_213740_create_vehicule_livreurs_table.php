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
        Schema::create('vehicule_livreurs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('livreur_id');
            $table->unsignedBigInteger('vehicule_id');
            $table->date('date_debut_affectation');
            $table->date('date_fin_affectation')->nullable();
            $table->integer('kilometrage_debut');
            $table->integer('kilometrage_fin')->nullable();
            $table->time('heure');
            $table->timestamps();
            $table->foreign('livreur_id')->references('id')->on('livreurs');
            $table->foreign('vehicule_id')->references('id')->on('vehicules');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicule_livreurs');
    }
};
