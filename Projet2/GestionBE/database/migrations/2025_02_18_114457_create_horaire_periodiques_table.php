<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('horaire_periodiques', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->integer('periode');
            $table->timestamps();
        });
    } 

    public function down()
    {
        Schema::dropIfExists('horaire_periodiques');
    } 
};