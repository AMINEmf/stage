<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateJourFeriesTable extends Migration
{
    public function up()
    {
        Schema::create('jour_feries', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('designation');
            $table->enum('type', ['paye', 'non_paye']);
            $table->time('duree')->nullable();
            $table->decimal('taux', 8, 2)->nullable();
            $table->string('categorie')->nullable();
            $table->boolean('fix')->default(false); // New column
            $table->integer('fix_day')->nullable(); // New column
            $table->integer('fix_month')->nullable(); // New column
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('jour_feries');
    }
}