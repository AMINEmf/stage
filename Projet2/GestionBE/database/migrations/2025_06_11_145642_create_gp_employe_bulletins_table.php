<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gp_employe_bulletins', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employe_id')->constrained('employes')->onDelete('cascade');
            
            $table->foreignId('bulletin_modele_id')->constrained('gp_bultin_models')->onDelete('cascade');

            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_employe_bulletins');
    }
};
