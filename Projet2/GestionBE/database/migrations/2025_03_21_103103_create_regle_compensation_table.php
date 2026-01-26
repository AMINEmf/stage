<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('regle_compensation', function (Blueprint $table) {
            $table->id(); // This creates a bigint unsigned column
            $table->string('description');
            $table->string('frequence_calcul');
            $table->decimal('plafond_hn', 10, 2);
            $table->timestamps();
            
            // Ensure InnoDB engine is used
            $table->engine = 'InnoDB';
        });
    } 

    public function down(): void
    {
        Schema::dropIfExists('regle_compensation');
    }
};