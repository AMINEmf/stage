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
        Schema::create('produits', function (Blueprint $table) {
            $table->id();
            $table->string('Code_produit')->unique();
            $table->string('designation');
            $table->string('type_quantite');
            $table->string('unite');
            $table->string('seuil_alerte');
            $table->string('stock_initial');
            $table->string('etat_produit');
            $table->string('marque');
            $table->string('logoP');
            $table->decimal('prix_vente')->nullable();
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('restrict');
            $table->unsignedBigInteger('categorie_id');
            $table->foreign('categorie_id')
                ->references('id')
                ->on('categories')
                ->onDelete('cascade');
                $table->unsignedBigInteger('calibre_id');
                $table->foreign('calibre_id')->references('id')->on('calibre')->onDelete('cascade');
            $table->timestamps();
        });
    }
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('produits');
    }
};
