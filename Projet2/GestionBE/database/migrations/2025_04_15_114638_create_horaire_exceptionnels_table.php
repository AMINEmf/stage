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
        Schema::create('horaire_exceptionnels', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id'); 
            $table->foreign('employee_id')->references('id')->on('employes')->onDelete('cascade');
            $table->date('date_debut');
            $table->date('date_fin');
            $table->unsignedBigInteger('horaire_id')->nullable(); 
            $table->foreign('horaire_id')->references('id')->on('groupe_horaires')->onDelete('cascade'); 
            $table->unsignedBigInteger('horaire_periodique_id')->nullable(); 
            $table->foreign('horaire_periodique_id')->references('id')->on('horaire_periodiques')->onDelete('cascade');
            $table->string('jour_debut')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('horaire_exceptionnels');
    }
};