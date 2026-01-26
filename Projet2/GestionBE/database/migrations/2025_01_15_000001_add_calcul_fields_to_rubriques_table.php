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
        Schema::table('rubriques', function (Blueprint $table) {
            // Champs pour l'onglet Calculs
            $table->string('calculs')->nullable()->after('memo'); // Type de calcul (Nombre x Base, etc.)
            $table->string('gain')->nullable()->after('calculs'); // retenue/gain
            $table->text('formule')->nullable()->after('gain'); // Formule générée automatiquement
            
            // Champs pour les valeurs de formule
            $table->string('formule_nombre')->nullable()->after('formule'); // Valeur ou code constante pour Nombre
            $table->string('formule_base')->nullable()->after('formule_nombre'); // Valeur ou code constante pour Base
            $table->string('formule_taux')->nullable()->after('formule_base'); // Valeur ou code constante pour Taux
            $table->string('formule_montant')->nullable()->after('formule_taux'); // Valeur ou code constante pour Montant
            
            // Champs booléens pour Report, Impression, Saisie
            $table->boolean('report_nombre')->default(false)->after('formule_montant');
            $table->boolean('report_base')->default(false)->after('report_nombre');
            $table->boolean('report_taux')->default(false)->after('report_base');
            $table->boolean('report_montant')->default(false)->after('report_taux');
            
            $table->boolean('impression_nombre')->default(false)->after('report_montant');
            $table->boolean('impression_base')->default(false)->after('impression_nombre');
            $table->boolean('impression_taux')->default(false)->after('impression_base');
            $table->boolean('impression_montant')->default(false)->after('impression_taux');
            
            $table->boolean('saisie_nombre')->default(false)->after('impression_montant');
            $table->boolean('saisie_base')->default(false)->after('saisie_nombre');
            $table->boolean('saisie_taux')->default(false)->after('saisie_base');
            $table->boolean('saisie_montant')->default(false)->after('saisie_taux');
            
            // Index pour optimiser les requêtes
            $table->index('calculs');
            $table->index('gain');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rubriques', function (Blueprint $table) {
            $table->dropIndex(['calculs']);
            $table->dropIndex(['gain']);
            
            $table->dropColumn([
                'calculs',
                'gain', 
                'formule',
                'formule_nombre',
                'formule_base',
                'formule_taux',
                'formule_montant',
                'report_nombre',
                'report_base',
                'report_taux',
                'report_montant',
                'impression_nombre',
                'impression_base',
                'impression_taux',
                'impression_montant',
                'saisie_nombre',
                'saisie_base',
                'saisie_taux',
                'saisie_montant'
            ]);
        });
    }
}; 