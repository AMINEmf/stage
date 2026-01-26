<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
{
    Schema::create('offre_groupe_table', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('Id_offre');
        $table->unsignedBigInteger('Id_groupe');
        $table->timestamps();

        $table->foreign('Id_offre')->references('id')->on('offres')->onDelete('cascade');
        $table->foreign('Id_groupe')->references('Id_groupe')->on('groupe_clients')->onDelete('cascade');
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('offre_groupe');
    }
};
