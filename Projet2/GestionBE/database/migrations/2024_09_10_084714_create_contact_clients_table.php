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
        Schema::create('contact_clients', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('idClient');
            $table->foreign('idClient')->references('id')->on('clients')->onDelete('cascade');

            $table->string('name');
            $table->string('type');
            $table->string('prenom');
            $table->integer('telephone');
            $table->string('email');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('contact_clients');
    }
};
