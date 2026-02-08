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
        Schema::create('details_declaration_cnss', function (Blueprint $table) {
            $table->id();
            $table->foreignId('declaration_cnss_id')
                ->constrained('declarations_cnss')
                ->cascadeOnDelete();
            $table->foreignId('employe_id')->constrained('employes');
            $table->foreignId('affiliation_cnss_id')->constrained('cnss_affiliations');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('details_declaration_cnss');
    }
};

