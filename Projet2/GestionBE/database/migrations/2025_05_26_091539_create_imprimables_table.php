<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateImprimablesTable extends Migration
{
    public function up()
    {
        Schema::create('imprimables', function (Blueprint $table) {
            $table->id();
            $table->string('designation');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('imprimables');
    }
}
