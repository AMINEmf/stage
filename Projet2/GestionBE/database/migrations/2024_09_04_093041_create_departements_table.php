<?php
// use Illuminate\Database\Migrations\Migration;
// use Illuminate\Database\Schema\Blueprint;
// use Illuminate\Support\Facades\Schema;

// return new class extends Migration
// {
//     public function up(): void
//     {
//         Schema::create('departements', function (Blueprint $table) {
//             $table->id();
//             $table->string('nom');
//             $table->unsignedBigInteger('parent_id')->nullable();
//             $table->timestamps();

//             $table->foreign('parent_id')->references('id')->on('departements')->onDelete('cascade');
//         });
//     }

//     public function down(): void
//     {
//         Schema::dropIfExists('departements');
//     }
// };
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint; 
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departements', function (Blueprint $table) {
            $table->id();
            $table->string('nom');
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('departements')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departements');
    }
};