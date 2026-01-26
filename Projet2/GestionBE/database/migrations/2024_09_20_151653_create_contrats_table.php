<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('contrats', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('employe_id');
        $table->string('numero_contrat')->nullable(); // N°contrat
        $table->string('type_contrat')->nullable();   // Type contrat
        $table->date('arret_prevu')->nullable();      // Arrêt prévu
        $table->integer('duree_prevu')->nullable();   // Durée prévue
        $table->string('design')->nullable();         // Design
        $table->date('debut_le')->nullable();         // Début le
        $table->date('arret_effectif')->nullable();  // Arrêt effectif
        $table->integer('duree_effective')->nullable();  // Durée effective
        $table->timestamps();
        $table->foreign('employe_id')->references('id')->on('employes')->onDelete('cascade');
    });
}

    public function down(): void
    {
        Schema::dropIfExists('contrats');
    }
};
