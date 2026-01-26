<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('gp_calendriers_employes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employe_id')->constrained('employes')->onDelete('cascade');
            $table->foreignId('calendrier_id')->constrained('calendries')->onDelete('cascade');

            $table->date('date_debut');
            $table->date('date_fin');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_calendriers_employes');
    }
};
