<?php

// use Illuminate\Database\Migrations\Migration;
// use Illuminate\Database\Schema\Blueprint;
// use Illuminate\Support\Facades\Schema;

// return new class extends Migration
// {
//     public function up(): void
//     {
//         Schema::create('employes', function (Blueprint $table) {
//             $table->id();
//             $table->string('matricule')->nullable();
//             $table->string('num_badge')->nullable();
//             $table->string('nom')->nullable();
//             $table->string('prenom')->nullable();
//             $table->string('lieu_naiss')->nullable();
//             $table->date('date_naiss')->nullable();
//             $table->string('cin')->nullable();
//             $table->string('cnss')->nullable();
//             $table->string('sexe', 50)->nullable();
//             $table->string('situation_fm')->nullable();
//             $table->integer('nb_enfants')->nullable();
//             $table->string('adresse')->nullable();
//             $table->string('ville')->nullable();
//             $table->string('pays')->nullable();
//             $table->string('code_postal', 20)->nullable();
//             $table->string('tel', 20)->nullable();
//             $table->string('fax', 20)->nullable();
//             $table->string('email', 35)->nullable();
//             $table->string('fonction')->nullable();
//             $table->string('nationalite')->nullable();
//             $table->string('niveau')->nullable();
//             $table->string('echelon')->nullable();
//             $table->string('categorie')->nullable();
//             $table->string('coeficients')->nullable();
//             $table->string('imputation')->nullable();
//             $table->date('date_entree')->nullable();
//             $table->date('date_embauche')->nullable();
//             $table->date('date_sortie')->nullable();
//             $table->decimal('salaire_base', 10, 2)->nullable();
//             $table->text('remarque')->nullable();
//             // $table->string('pointage_auto')->nullable();
//             // $table->string('regle_paiment');
//             // $table->string('famille_jour_ferie');
//             // $table->string('code_cal');
//             $table->string('url_img')->nullable();
//             // $table->integer('numorder');
//             // $table->boolean('afficherEtats')->nullable();
//             $table->string('centreCout')->nullable();
//             $table->Integer('departement_id');
//             // $table->foreign('departement_id')->references('id')->on('departements')->onDelete('cascade');
//             $table->timestamps();
//         });
//     }

//     public function down(): void
//     {
//         Schema::dropIfExists('employes');
//     }
// };
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employes', function (Blueprint $table) {
            $table->id();
            $table->string('matricule')->nullable();
            $table->string('num_badge')->nullable();
            $table->string('nom')->nullable();
            $table->string('prenom')->nullable();
            $table->string('lieu_naiss')->nullable();
            $table->date('date_naiss')->nullable();
            $table->string('cin')->nullable();
            $table->string('cnss')->nullable();
            $table->string('sexe', 50)->nullable();
            $table->string('situation_fm')->nullable();
            $table->integer('nb_enfants')->nullable();
            $table->string('adresse')->nullable();
            $table->string('ville')->nullable();
            $table->string('pays')->nullable();
            $table->string('code_postal', 20)->nullable();
            $table->string('tel', 20)->nullable();
            $table->string('fax', 20)->nullable();
            $table->string('email', 35)->nullable();
            $table->string('fonction')->nullable();
            $table->string('nationalite')->nullable();
            $table->string('niveau')->nullable();
            $table->string('echelon')->nullable();
            $table->string('categorie')->nullable();
            $table->string('coeficients')->nullable();
            $table->string('imputation')->nullable();
            $table->date('date_entree')->nullable();
            $table->date('date_embauche')->nullable();
            $table->date('date_sortie')->nullable();
            $table->decimal('salaire_base', 10, 2)->nullable();
            $table->text('remarque')->nullable();
            $table->string('url_img')->nullable();
            $table->string('centreCout')->nullable();
            $table->integer('departement_id')->nullable();
            $table->boolean('active')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employes');
    }
};
