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
        Schema::create('stock__productions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('produit_id');
            $table->date('date');
            $table->integer('quantite');
            $table->string('n_lot');
            $table->string('nom_fournisseur');
            $table->timestamps();

            $table->foreign('produit_id')->references('id')->on('produits')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock__productions');
    }
};
