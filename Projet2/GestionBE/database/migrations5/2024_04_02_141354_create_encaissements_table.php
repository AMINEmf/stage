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
        Schema::create('encaissements', function (Blueprint $table) {
            $table->id();
            $table->string('referencee');
            $table->date('date_encaissement');
            $table->string('montant_total');
            $table->unsignedBigInteger('comptes_id');
            $table->foreign('comptes_id')->references('id')->on('comptes')->onDelete('restrict');
            $table->string('type_encaissement');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('encaissements');
    }
};
