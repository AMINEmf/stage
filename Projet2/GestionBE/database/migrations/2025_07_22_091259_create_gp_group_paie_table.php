<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('gp_group_paie', function (Blueprint $table) {
            $table->id();
            $table->string('designation');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gp_group_paie');
    }
};
