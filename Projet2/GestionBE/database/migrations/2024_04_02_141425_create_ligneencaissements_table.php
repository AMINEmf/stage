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
        Schema::create('ligneencaissements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('entrer_comptes_id');
            $table->foreign('entrer_comptes_id')->references('id')->on('entrer_comptes')->onDelete('restrict');
            $table->unsignedBigInteger('encaissements_id');
            $table->foreign('encaissements_id')->references('id')->on('encaissements')->onDelete('restrict');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ligneencaissements');
    }
};
