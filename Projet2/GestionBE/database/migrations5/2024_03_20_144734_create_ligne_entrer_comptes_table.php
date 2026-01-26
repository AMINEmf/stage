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
        Schema::create('ligneentrercomptes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('entrer_comptes_id');
            $table->foreign('entrer_comptes_id')->references('id')->on('entrer_comptes')->onDelete('restrict');

             $table->unsignedBigInteger('client_id');
            $table->foreign('client_id')->references('id')->on('clients')->onDelete('restrict');
            $table->unsignedBigInteger('id_facture');
            $table->foreign('id_facture')->references('id')->on('factures')->onDelete('restrict');
            $table->decimal('avance')->nullable();
            $table->decimal('restee');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ligneentrercomptes');
    }
};
