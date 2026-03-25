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
        Schema::table('credits', function (Blueprint $table) {
            $table->foreignId('id_typeCredit')
                ->nullable()
                ->after('id_credit')
                ->constrained('type_credit','id_typeCredit');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('credits', function (Blueprint $table) {
            $table->dropForeign(['id_typeCredit']);
            $table->dropColumn('id_typeCredit');
        });
    }
};
