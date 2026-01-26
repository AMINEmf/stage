<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateGpBonSortieTable extends Migration
{
    public function up(): void
    {
        Schema::create('gp_bon_sortie', function (Blueprint $table) {
            $table->id();
            
            $table->date('date_sortie')->nullable();
            $table->time('heure_sortie')->nullable();
            $table->string('duree_estimee')->nullable();
            $table->text('motif_sortie')->nullable();
            $table->string('responsable_nom')->nullable();
            $table->string('responsable_poste')->nullable();
            $table->date('date_autorisation')->nullable();
            $table->time('heure_retour')->nullable();
            $table->date('date_retour')->nullable();
            $table->foreignId('employee_id')->constrained('employes')->onDelete('cascade');


            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_bon_sortie');
    }
    
}
