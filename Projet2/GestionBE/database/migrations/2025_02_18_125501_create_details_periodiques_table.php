<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('details_periodiques', function (Blueprint $table) {
            $table->id();
            $table->integer('numero_jour')->nullable();
            $table->string('libele')->nullable();
            $table->string('horaire')->nullable();
            $table->foreignId('groupe_horaire_id')->constrained('horaire_periodiques')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('details_periodiques');
    }
};