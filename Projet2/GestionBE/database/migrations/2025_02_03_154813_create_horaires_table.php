<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('horaires', function (Blueprint $table) {
            $table->id();
            $table->string('typePlageHoraire')->default('obligatoire');
            $table->integer('tauxPlageHoraire')->default(0);
            $table->enum('tauxType', ['heure', 'jours'])->default('heure');
            $table->time('entreeDe')->default('00:00');
            $table->time('entreeA')->default('00:00');
            $table->string('penaliteEntree')->nullable();
            $table->time('reposDe')->default('00:00');
            $table->time('reposA')->default('00:00');
            $table->enum('deduireRepos', ['Deduit', 'NonDeduit'])->nullable();
            $table->time('dureeRepos')->default('00:00');
            $table->time('sortieDe')->default('00:00');
            $table->time('sortieA')->default('00:00');
            $table->boolean('pointageAutomatique')->default(false);
            $table->string('penaliteSortie')->nullable();
            $table->integer('cumul')->default(0);
            $table->integer('jourTravaille')->default(0);
            $table->string('couleur')->default('#000000');
            $table->integer('groupe_horaire_id')->nullable();
            $table->time('heureDebut')->nullable();
            $table->time('heureFin')->nullable();
            $table->string('horaireJournalier')->nullable();
            $table->integer('typeHoraire')->nullable();
            $table->boolean('veille')->default(false);
            $table->boolean('jourPlus1')->default(false);

            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('horaires');
    }
    
};
