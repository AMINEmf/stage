<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('groupe_horaires', function (Blueprint $table) {
            $table->id();
            $table->string('designation');
            $table->enum('type', ['fixe', 'automatique','flexible ouvrable']);
            $table->string('abreviation')->nullable();
            $table->string('couleur')->nullable();
            $table->timestamps();
        });
    } 

    public function down(): void
    {
        Schema::dropIfExists('groupes_horaires');
    }
};