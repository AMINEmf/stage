<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::create('group_motif_absences', function (Blueprint $table) {
            $table->id();
            $table->string('designation', 255);
            $table->timestamps();
        });
    }

    public function down() {
        Schema::dropIfExists('group_motif_absences');
    }
};
