<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DetailMotifAbsence extends Model {
    use HasFactory;

    protected $fillable = [
        'designation',
        'abreviation',
        'type',
        'cause',
        'commentaire',
        'group_motif_absence_id' // Add this line
    ];

    public function groupMotifAbsence() {
        return $this->belongsTo(GroupMotifAbsence::class);
    }
}

