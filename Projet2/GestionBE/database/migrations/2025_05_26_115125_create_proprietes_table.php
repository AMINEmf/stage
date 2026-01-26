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
        Schema::create('proprietes', function (Blueprint $table) {
            $table->id();

            // Clés étrangères (nullable si la relation n'est pas obligatoire)
            $table->unsignedBigInteger('imprimable_id')->nullable();
            $table->unsignedBigInteger('mois_cloture_id')->nullable();
            $table->unsignedBigInteger('rappel_salaire_id')->nullable();

            // Champs booléens
            $table->boolean('en_activite')->default(false);
            $table->boolean('regularisation')->default(false);
            $table->boolean('visible')->default(false);
            $table->boolean('exclue_net_payer')->default(false);

            $table->timestamps();

            // Contraintes de clé étrangère
            $table->foreign('imprimable_id')->references('id')->on('imprimables')->onDelete('set null');
            $table->foreign('mois_cloture_id')->references('id')->on('mois_clotures')->onDelete('set null');
            $table->foreign('rappel_salaire_id')->references('id')->on('rappel_salaires')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('proprietes');
    }
};
