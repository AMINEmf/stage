<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('details_calendries', function (Blueprint $table) {
            $table->id();
            $table->string('debut')->nullable();
            $table->string('fin')->nullable();
            $table->foreignId('groupe_id')->constrained('calendries')->onDelete('cascade');
            $table->foreignId('groupe_horaire_id')->constrained('horaire_periodiques')->onDelete('cascade'); 
            $table->string('jourDebut')->nullable();
            $table->timestamps();
        });
    }

    public function down() 
    {
        Schema::dropIfExists('details_calendries');
    }
};
