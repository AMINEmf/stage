<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('declarations_cnss')) {
            return;
        }

        // Expand enum temporarily so legacy values can be mapped safely.
        DB::statement("ALTER TABLE declarations_cnss MODIFY statut ENUM('BROUILLON','VALIDEE','ENVOYEE','EN_ATTENTE','DECLARE','PAYE') NOT NULL DEFAULT 'BROUILLON'");

        // Migrate old status values to the new business workflow.
        DB::table('declarations_cnss')
            ->where('statut', 'BROUILLON')
            ->update(['statut' => 'EN_ATTENTE']);
        DB::table('declarations_cnss')
            ->where('statut', 'VALIDEE')
            ->update(['statut' => 'DECLARE']);
        DB::table('declarations_cnss')
            ->where('statut', 'ENVOYEE')
            ->update(['statut' => 'PAYE']);

        DB::statement("ALTER TABLE declarations_cnss MODIFY statut ENUM('EN_ATTENTE','DECLARE','PAYE') NOT NULL DEFAULT 'EN_ATTENTE'");

        if (Schema::hasColumn('declarations_cnss', 'departement_id')) {
            Schema::table('declarations_cnss', function (Blueprint $table) {
                $table->dropConstrainedForeignId('departement_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('declarations_cnss')) {
            return;
        }

        DB::statement("ALTER TABLE declarations_cnss MODIFY statut ENUM('BROUILLON','VALIDEE','ENVOYEE','EN_ATTENTE','DECLARE','PAYE') NOT NULL DEFAULT 'EN_ATTENTE'");

        DB::table('declarations_cnss')
            ->where('statut', 'EN_ATTENTE')
            ->update(['statut' => 'BROUILLON']);
        DB::table('declarations_cnss')
            ->where('statut', 'DECLARE')
            ->update(['statut' => 'VALIDEE']);
        DB::table('declarations_cnss')
            ->where('statut', 'PAYE')
            ->update(['statut' => 'ENVOYEE']);

        DB::statement("ALTER TABLE declarations_cnss MODIFY statut ENUM('BROUILLON','VALIDEE','ENVOYEE') NOT NULL DEFAULT 'BROUILLON'");

        if (!Schema::hasColumn('declarations_cnss', 'departement_id')) {
            Schema::table('declarations_cnss', function (Blueprint $table) {
                $table->foreignId('departement_id')->nullable()->constrained('departements');
            });
        }
    }
};
