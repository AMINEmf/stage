<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accidents', function (Blueprint $table) {
            $table->id();
            $table->string('employe');
            $table->string('matricule');
            $table->date('date_accident');
            $table->time('heure');
            $table->string('lieu');
            $table->string('type_accident');
            $table->enum('gravite', ['léger', 'grave']);
            $table->boolean('arret_travail')->default(false);
            $table->unsignedInteger('duree_arret')->default(0);
            $table->boolean('declaration_cnss')->default(false);
            $table->enum('statut', ['en cours', 'déclaré', 'clôturé'])->default('en cours');
            $table->foreignId('departement_id')->nullable()->constrained('departements')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accidents');
    }
};
