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
        Schema::create('gp_bultin_model_rubrique', function (Blueprint $table) {
            $table->id();
             $table->foreignId('bultin_model_id')->constrained('gp_bultin_models')
            ->onUpdate('cascade')->onDelete('cascade');
             $table->foreignId('rubrique_id')->constrained('rubriques')
             ->onUpdate('cascade')->onDelete('cascade');
             $table->integer('ordre')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gp_bultin_model_rubrique');
    }
};
