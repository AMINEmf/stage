<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('arrondis', function (Blueprint $table) {
            $table->id();
            $table->float('min');
            $table->float('max');
            $table->float('valeur_arrondi');
            $table->enum('type_arrondi', ['Ajouter', 'Détruire']);
            $table->foreignId('groupe_arrondi_id')->references('id')->on('groupe_arrondi')->cascadeOnUpdate()->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('arrondis');
    }
};