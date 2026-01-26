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
        Schema::create('penalites', function (Blueprint $table) {
            $table->id();
            $table->string('description');
            $table->enum('type', ['entree', 'sortie']);
            $table->decimal('ecart_min', 8, 2);
            $table->decimal('ecart_max', 8, 2);
            $table->decimal('penalite', 8, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('penalites');
    }
};