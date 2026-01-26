<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('absence_previsionnels', function (Blueprint $table) {
            $table->id();
            $table->string('absence'); 
            $table->date('date_depart'); 
            $table->time('heure_depart'); 
            $table->date('date_reprise'); 
            $table->time('heure_reprise'); 
            $table->foreignId('employee_id')->constrained('employes')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('absence_previsionnels');
    }
};
