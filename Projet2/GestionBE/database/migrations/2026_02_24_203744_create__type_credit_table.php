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
        Schema::create('Type_credit', function (Blueprint $table) {
            $table->id('id_TypeCredit');
            $table->string('nom_type');
            $table->decimal('taux_base',5,2);
            $table->decimal('montant_max',10,2);
            $table->date('duree_max');

            $table->foreignId('id_credit')->constrained('credits','id_credit')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Type_credit');
    }
};
