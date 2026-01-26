<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('gp_agences', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->foreignId('banque_id')
                  ->nullable()
                  ->constrained('gp_banques')
                  ->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_agences');
    }
};
