<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gp_paie_rubrique', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_paie_id')->constrained('gp_group_paie')
                ->onUpdate('cascade')->onDelete('cascade');
            $table->foreignId('rubrique_id')->constrained('rubriques')
                ->onUpdate('cascade')->onDelete('cascade');
            $table->integer('ordre')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_paie_rubrique');
    }
};
