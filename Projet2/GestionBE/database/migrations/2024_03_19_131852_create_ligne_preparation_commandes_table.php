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
        Schema::create('ligne_preparation_commandes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('preparation_id');
            $table->foreign('preparation_id')->references('id')->on('preparation_commandes')->onDelete('cascade');
            $table->unsignedBigInteger('produit_id');
            $table->foreign('produit_id')->references('id')->on('produits')->onDelete('restrict');
            $table->unsignedBigInteger('quantite');
            $table->unsignedBigInteger('prix_unitaire');
            $table->string('lot')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ligne_preparation_commandes');
    }
};
