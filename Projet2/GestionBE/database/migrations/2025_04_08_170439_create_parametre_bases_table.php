<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('parametre_bases', function (Blueprint $table) {
            $table->id();
            $table->string('parametre');
            $table->string('valeur');
            $table->string('type');
            $table->string('description')->nullable();
            $table->timestamps();
        });
    }
    public function down()
    {
        Schema::dropIfExists('parametre_bases');
    }
};