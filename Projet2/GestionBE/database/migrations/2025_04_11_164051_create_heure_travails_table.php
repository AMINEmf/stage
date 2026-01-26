<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('heures_travail', function (Blueprint $table) {
            $table->id();
            $table->boolean('heures_normales')->default(false);
            $table->boolean('ferie_paye')->default(false);
            $table->boolean('absence_paye')->default(false);
            $table->boolean('absence')->default(false);
            $table->boolean('heures_sup_0')->default(false);
            $table->boolean('heures_sup_25')->default(false);
            $table->boolean('heures_sup_50')->default(false);
            $table->boolean('heures_sup_100')->default(false);
            $table->text('commentaire')->nullable();
            $table->timestamps();
            
            $table->engine = 'InnoDB';
        });
    }

    public function down()
    {
        Schema::dropIfExists('heures_travail');
    }
};