<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('declarations_individuelles_cnss', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employe_id')->constrained('employes')->onDelete('cascade');
            $table->unsignedTinyInteger('mois');           // 1–12
            $table->unsignedSmallInteger('annee');
            $table->unsignedTinyInteger('jours_travailles')->default(26);
            $table->decimal('salaire_brut_imposable', 12, 2)->default(0);
            $table->decimal('base_plafonnee', 12, 2)->default(0);
            $table->decimal('cotisation_salarie', 12, 2)->default(0);
            $table->decimal('cotisation_patronale', 12, 2)->default(0);
            $table->enum('statut', ['non_declare', 'declare', 'valide', 'paye'])->default('non_declare');
            $table->timestamps();

            $table->unique(['employe_id', 'mois', 'annee'], 'uq_dec_indiv_employe_mois_annee');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('declarations_individuelles_cnss');
    }
};
