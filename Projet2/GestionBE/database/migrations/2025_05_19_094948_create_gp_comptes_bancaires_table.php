<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('gp_comptes_bancaires', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employe_id')
                  ->constrained('employes')
                  ->cascadeOnDelete();
            $table->foreignId('agence_id')
                  ->nullable()
                  ->constrained('gp_agences')
                  ->nullOnDelete();
            $table->string('rib')->nullable();
            $table->string('iban')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_comptes_bancaires');
    }
};
