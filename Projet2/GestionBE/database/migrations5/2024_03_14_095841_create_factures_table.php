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
        Schema::create('factures', function (Blueprint $table) {
            $table->id();
            $table->string('reference');
            $table->date('date');
            $table->string('ref_BL')->nullable();
            $table->string('ref_BC')->nullable();
            $table->string('modePaiement')->nullable();
            $table->string('total_ttc')->nullable();
            $table->string('type')->nullable();
            $table->unsignedBigInteger('client_id');
            $table->foreign('client_id')->references('id')->on('clients')->onDelete('restrict');
            $table->unsignedBigInteger('id_devis')->nullable();
            $table->foreign('id_devis')->references('id')->on('devis')->onDelete('restrict');
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('restrict');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('factures');
    }
};
