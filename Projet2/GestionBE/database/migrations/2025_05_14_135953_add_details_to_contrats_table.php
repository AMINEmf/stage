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
        Schema::table('contrats', function (Blueprint $table) {
            $table->string('motif_depart')->nullable();
            $table->date('dernier_jour_travaille')->nullable();
            $table->date('notification_rupture')->nullable();
            $table->date('engagement_procedure')->nullable();
            $table->date('signature_rupture_conventionnelle')->nullable();
            $table->boolean('transaction_en_cours')->nullable();
        });
    }
    
    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('contrats', function (Blueprint $table) {
            $table->dropColumn([
                'motif_depart',
                'dernier_jour_travaille',
                'notification_rupture',
                'engagement_procedure',
                'signature_rupture_conventionnelle',
                'transaction_en_cours',
            ]);
        });
    }
    };
