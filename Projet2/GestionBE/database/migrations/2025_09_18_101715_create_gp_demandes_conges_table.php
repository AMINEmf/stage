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
        Schema::create('gp_demandes_conges', function (Blueprint $table) {
            $table->id();

            $table->foreignId('employe_id')
                  ->constrained('employes')
                  ->onDelete('cascade');

            $table->string('type_conge');
            $table->date('date_debut');
            $table->date('date_fin');
            $table->integer('nombre_jours')->nullable();
            $table->text('motif')->nullable();
            $table->string('piece_jointe')->nullable();

            $table->enum('statut', ['en_attente', 'approuve', 'rejete'])->default('en_attente');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gp_demandes_conges');
    }
};
