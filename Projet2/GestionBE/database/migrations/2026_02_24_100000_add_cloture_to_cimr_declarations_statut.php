<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE cimr_declarations MODIFY COLUMN statut ENUM('a_declarer', 'declare', 'paye', 'cloture') NOT NULL DEFAULT 'a_declarer'");
    }

    public function down(): void
    {
        // Convert any 'cloture' back to 'declare' before removing the value
        DB::statement("UPDATE cimr_declarations SET statut = 'declare' WHERE statut = 'cloture'");
        DB::statement("ALTER TABLE cimr_declarations MODIFY COLUMN statut ENUM('a_declarer', 'declare', 'paye') NOT NULL DEFAULT 'a_declarer'");
    }
};
