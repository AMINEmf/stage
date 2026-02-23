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
        Schema::table('cimr_affiliations', function (Blueprint $table) {
            $table->string('cin')->nullable()->after('matricule');
            $table->string('poste')->nullable()->after('cin');
            $table->date('date_embauche')->nullable()->after('poste');
            $table->date('date_fin_affiliation')->nullable()->after('date_affiliation');
            $table->string('fiche_affiliation')->nullable()->after('statut');
            $table->dropColumn('affilie_cimr');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cimr_affiliations', function (Blueprint $table) {
            $table->dropColumn(['cin', 'poste', 'date_embauche', 'date_fin_affiliation', 'fiche_affiliation']);
            $table->boolean('affilie_cimr')->default(false)->after('departement_id');
        });
    }
};
