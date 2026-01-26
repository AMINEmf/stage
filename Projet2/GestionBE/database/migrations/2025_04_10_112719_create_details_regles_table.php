<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('details_regles', function (Blueprint $table) {
            $table->id();
            $table->string('heures_supplementaires');
            $table->string('supplement'); // Will store "0" or "1" as strings
            $table->string('autre_supplement')->nullable(); // Will store "0" or "1" as strings
            $table->decimal('plafond', 10, 2);
            $table->integer('numero_ordre');
            $table->unsignedBigInteger('regle_compensation_id');
            $table->timestamps();
            
            $table->foreign('regle_compensation_id')
                  ->references('id')
                  ->on('regle_compensation')
                  ->onDelete('cascade');
                  
            $table->engine = 'InnoDB';
        });
    }

    public function down()
    {
        Schema::dropIfExists('details_regles');
    }
};