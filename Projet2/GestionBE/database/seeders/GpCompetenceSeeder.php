<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class GpCompetenceSeeder extends Seeder
{
    /**
     * Seed base competences used by careers and formations modules.
     */
    public function run(): void
    {
        if (!Schema::hasTable('gp_competences')) {
            $this->command?->warn('Table gp_competences introuvable, seed ignore.');
            return;
        }

        $now = now();

        $rows = [
            ['nom' => 'Communication', 'categorie' => 'Soft Skills', 'description' => 'Communication orale et ecrite claire'],
            ['nom' => 'Travail en equipe', 'categorie' => 'Soft Skills', 'description' => 'Collaboration et coordination inter-equipes'],
            ['nom' => 'Leadership', 'categorie' => 'Soft Skills', 'description' => 'Capacite a encadrer et motiver une equipe'],
            ['nom' => 'Gestion du temps', 'categorie' => 'Soft Skills', 'description' => 'Priorisation et organisation des taches'],
            ['nom' => 'Resolution de problemes', 'categorie' => 'Soft Skills', 'description' => 'Analyse et proposition de solutions efficaces'],

            ['nom' => 'Excel avance', 'categorie' => 'Bureautique', 'description' => 'Tableaux croises, fonctions et reporting'],
            ['nom' => 'Power BI', 'categorie' => 'Data', 'description' => 'Visualisation et suivi des indicateurs'],
            ['nom' => 'SQL', 'categorie' => 'Technique', 'description' => 'Manipulation et analyse de donnees relationnelles'],
            ['nom' => 'Gestion de projet', 'categorie' => 'Management', 'description' => 'Planification, suivi et coordination des projets'],
            ['nom' => 'Recrutement', 'categorie' => 'RH', 'description' => 'Conduite des processus de recrutement'],
            ['nom' => 'Paie', 'categorie' => 'RH', 'description' => 'Gestion des elements de paie et conformite'],
            ['nom' => 'Droit social', 'categorie' => 'RH', 'description' => 'Connaissance du cadre legal et conventionnel'],
        ];

        $payload = array_map(
            static fn (array $row) => $row + ['created_at' => $now, 'updated_at' => $now],
            $rows
        );

        DB::table('gp_competences')->upsert(
            $payload,
            ['nom', 'categorie'],
            ['description', 'updated_at']
        );

        $this->command?->info('GpCompetenceSeeder execute: competences ajoutees/mises a jour.');
    }
}
