<?php


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOffreDetailsTable extends Migration
{
    public function up()
    {
        Schema::create('offre_details', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('produit_id');
            $table->decimal('Prix', 8, 2);
            $table->unsignedBigInteger('id_offre');
            $table->foreign('produit_id')->references('id')->on('produits')->onDelete('restrict');
            $table->foreign('id_offre')->references('id')->on('offres')->onDelete('restrict');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('offre_details');
    }
}
// use Illuminate\Database\Migrations\Migration;
// use Illuminate\Database\Schema\Blueprint;
// use Illuminate\Support\Facades\Schema;

// class CreateOffreDetailsTable extends Migration
// {
//     public function up()
//     {
//         Schema::create('offre_details', function (Blueprint $table) {
//             $table->id();
//             $table->string('Code_details');
//             $table->string('Désignation');
//             $table->decimal('Prix', 8, 2);
//             $table->unsignedBigInteger('id_offre');
//             $table->foreign('id_offre')->references('id')->on('offres')->onDelete('restrict');
//             $table->timestamps();
//         });
//     }

//     public function down()
//     {
//         Schema::dropIfExists('offre_details');
//     }
// }
