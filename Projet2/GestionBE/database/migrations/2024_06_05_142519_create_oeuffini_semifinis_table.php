<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('oeuffini_semifinis', function (Blueprint $table) {
            $table->id();
            $table->date('date')->nullable();
            $table->string('eau_semifini')->nullable();
            $table->string('entier_semifini')->nullable();
            $table->string('janne_semifini')->nullable();
            $table->string('blan_semifini')->nullable();
            $table->string('LC_semifini')->nullable();
            $table->string('oeufcongles_semifini')->nullable();
            $table->string('entier_fini')->nullable();
            $table->string('janne_fini')->nullable();
            $table->string('blan_fini')->nullable();
            $table->string('LC_fini')->nullable();
            $table->string('oeufcongles_fini')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('oeuffini_semifinis');
    }
};
