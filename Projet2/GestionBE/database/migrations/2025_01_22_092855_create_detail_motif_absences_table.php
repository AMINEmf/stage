<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up() {
        Schema::create('detail_motif_absences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_motif_absence_id')
                  ->nullable()
                  ->constrained('group_motif_absences')
                  ->onDelete('set null');
            $table->string('designation', 255);
            $table->string('abreviation', 50);
            $table->enum('type', ['payé', 'non payé'])->default('payé');
            $table->enum('cause', ['congé', 'maladie'])->default('congé');
            $table->text('commentaire')->nullable();
            $table->timestamps();
        });
    }

    public function down() {
        Schema::table('detail_motif_absences', function (Blueprint $table) {
            $table->dropForeign(['group_motif_absence_id']);
            $table->dropColumn('group_motif_absence_id');
        });
    }
};