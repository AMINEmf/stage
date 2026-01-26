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
        Schema::table('employes', function (Blueprint $table) {
            $table->string('delivree_par')->nullable();
            $table->date('date_expiration')->nullable();
            $table->string('carte_sejour')->nullable();
            $table->string('motif_depart')->nullable();
            $table->date('dernier_jour_travaille')->nullable();
            $table->date('notification_rupture')->nullable();
            $table->date('engagement_procedure')->nullable();
            $table->date('signature_rupture_conventionnelle')->nullable();
            $table->boolean('transaction_en_cours')->default(false);
            $table->boolean('bulletin_modele')->default(false);
            $table->decimal('salaire_moyen', 10, 2)->nullable();
            $table->decimal('salaire_reference_annuel', 10, 2)->nullable();
        });
    }
    
    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('employes', function (Blueprint $table) {
            $table->dropColumn([
                'delivree_par',
                'date_expiration',
                'carte_sejour',
                'motif_depart',
                'dernier_jour_travaille',
                'notification_rupture',
                'engagement_procedure',
                'signature_rupture_conventionnelle',
                'transaction_en_cours',
                'bulletin_modele',
                'salaire_moyen',
                'salaire_reference_annuel',
            ]);
        });
    }
    };
