<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateGpRegleEmployeTable extends Migration
{
    public function up()
    {
        Schema::create('gp_regle_employe', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employe_id');
            $table->unsignedBigInteger('regle_id');
            $table->date('date_debut');
            $table->date('date_fin');
            $table->timestamps();

            // Clés étrangères
            $table->foreign('employe_id')->references('id')->on('employes')->onDelete('cascade');
            $table->foreign('regle_id')->references('id')->on('regle_compensation')->onDelete('cascade');
            
            // Optionnel : index pour accélérer les recherches
            $table->index(['employe_id', 'regle_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('gp_regle_employe');
    }
}
