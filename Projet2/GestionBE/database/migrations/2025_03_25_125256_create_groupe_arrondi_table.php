<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('groupe_arrondi', function (Blueprint $table) {
            $table->id();
            $table->string('designation');
            $table->boolean('HT')->default(false);
            $table->boolean('HN')->default(false);
            $table->boolean('PR')->default(false);
            $table->boolean('HS_0')->default(false);
            $table->boolean('HS_25')->default(false);
            $table->boolean('HS_50')->default(false);
            $table->boolean('HS_100')->default(false);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('groupe_arrondi');
    }
};