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
        Schema::create('historique', function (Blueprint $table) {
            $table->id('id_historique');
            $table->string('fullName_Emp');
            $table->string('statut_Emp');
            $table->string('poste_Emp');
            $table->string('type_contrat');
            $table->string('type_Credit');
            $table->decimal('montant_demande',10,2);
            $table->unsignedBigInteger('id_credit');
            $table->foreign('id_credit')
                  ->references('id_credit')
                    ->on('credits')
                    ->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {    
        Schema::dropIfExists('historique');   
    }
};

