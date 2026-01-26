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
        Schema::create('agents', function (Blueprint $table) {
            $table->id();
            $table->string('NomAgent');
            $table->string('PrenomAgent');
            $table->enum('SexeAgent', ['Masculin', 'Feminin']);            
            $table->string('EmailAgent',100)->unique();
            $table->string('TelAgent');
            $table->string('AdresseAgent');
            $table->string('VilleAgent');
            $table->string('CodePostalAgent');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('agents');
    }
};
