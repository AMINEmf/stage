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
        Schema::create('constantes', function (Blueprint $table) {
            $table->id();
            $table->string('code');
            $table->string('designation');
            $table->string('type_constante');
            $table->text('memo')->nullable();
            $table->string('valeur');
            $table->boolean('visibilite')->default(true);
            $table->foreignId('group_constante_id')->constrained('group_constantes')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('constantes');
    }
};
