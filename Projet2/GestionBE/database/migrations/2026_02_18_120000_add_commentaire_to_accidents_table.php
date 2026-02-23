<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accidents', function (Blueprint $table) {
            if (!Schema::hasColumn('accidents', 'commentaire')) {
                $table->text('commentaire')->nullable()->after('statut');
            }
        });
    }

    public function down(): void
    {
        Schema::table('accidents', function (Blueprint $table) {
            if (Schema::hasColumn('accidents', 'commentaire')) {
                $table->dropColumn('commentaire');
            }
        });
    }
};
