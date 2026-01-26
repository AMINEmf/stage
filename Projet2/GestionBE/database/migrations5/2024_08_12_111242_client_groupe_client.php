<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_groupe_client', function (Blueprint $table) {
            $table->string('CodeClient');
            $table->unsignedBigInteger('Id_groupe');

            $table->foreign('CodeClient')->references('CodeClient')->on('clients')->onDelete('cascade');
            $table->foreign('Id_groupe')->references('Id_groupe')->on('groupe_clients')->onDelete('cascade');

            $table->primary(['CodeClient', 'Id_groupe']);
            $table->timestamps(); 
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_groupe_client');
    }
};
