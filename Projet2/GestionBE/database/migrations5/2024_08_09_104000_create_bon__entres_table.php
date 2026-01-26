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
        Schema::create('bon__entres', function (Blueprint $table) {
            $table->id();
            
            $table->string('reference');
            $table->string('source');
            $table->date('date');
            $table->string('emetteur');
            $table->string('recepteur');
            $table->string('type');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bon__entres');
    }
};
