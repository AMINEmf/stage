<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cimr_affiliations', function (Blueprint $table) {
            $table->decimal('montant_cotisation', 15, 2)->nullable()->after('taux_employeur');
        });
    }

    public function down(): void
    {
        Schema::table('cimr_affiliations', function (Blueprint $table) {
            $table->dropColumn('montant_cotisation');
        });
    }
};
