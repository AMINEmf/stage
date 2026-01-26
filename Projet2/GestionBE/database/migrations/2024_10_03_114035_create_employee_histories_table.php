<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateEmployeeHistoriesTable extends Migration
{
    public function up()
    {
        Schema::create('employee_histories', function (Blueprint $table) {
            $table->id();
            $table->string('matricule')->nullable();
            $table->string('nom');
            $table->string('prenom');
            $table->unsignedBigInteger('departement_id')->nullable();
            $table->string('departement_nom')->nullable(); // Add this line
            $table->unsignedBigInteger('employe_id');
            $table->date('date_début')->nullable();
            $table->date('date_fin')->nullable();
            $table->string('action');
            $table->timestamps();

            // Remove the foreign key constraint
            // $table->foreign('departement_id')->references('id')->on('departements')->onDelete('no action');

            // Add indexes for better query performance
            $table->index('departement_id');
            $table->index('employe_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('employee_histories');
    }
} 
//  use Illuminate\Database\Migrations\Migration;
// use Illuminate\Database\Schema\Blueprint;
// use Illuminate\Support\Facades\Schema;

// class CreateEmployeeHistoriesTable extends Migration
// {
//     public function up()
//     {
//         Schema::create('employee_histories', function (Blueprint $table) {
//             $table->id();
//             $table->string('matricule')->nullable();
//             $table->string('nom');
//             $table->string('prenom');
//             $table->unsignedBigInteger('departement_id')->nullable();
//             $table->unsignedBigInteger('employe_id');
//             $table->date('date_début')->nullable();
//             $table->date('date_fin')->nullable();
//             $table->string('action');
//             $table->timestamps();

//             $table->foreign('departement_id')->references('id')->on('departements')->onDelete('no action');

//         });
//     }

//     public function down()
//     {
//         Schema::dropIfExists('employee_histories');
//     }
// }
