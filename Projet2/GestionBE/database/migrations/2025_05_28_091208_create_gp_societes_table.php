<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateGpSocietesTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('gp_societes', function (Blueprint $table) {
            $table->id();
            $table->string('RaisonSocial');
            $table->string('ICE');
            $table->string('NumeroCNSS');
            $table->string('NumeroFiscale');
            $table->string('RegistreCommercial');
            $table->string('AdresseSociete');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gp_societes');
    }
}
