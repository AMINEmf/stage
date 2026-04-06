<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Poste extends Model
{
    use HasFactory;

    protected $table = 'gp_postes';

    protected $fillable = [
        'nom',
        'description',
        'domaine',
        'unite_id',
        'grade_id',
        'statut',
        'niveau',
        'is_active',
        'code',
    ];

    public function unite()
    {
        return $this->belongsTo(Unite::class, 'unite_id');
    }

    public function grade()
    {
        return $this->belongsTo(GpGrade::class, 'grade_id');
    }

    public function competences()
    {
        return $this->belongsToMany(GpCompetence::class, 'gp_poste_competence', 'poste_id', 'competence_id')
            ->withPivot(['niveau_requis', 'is_required'])
            ->withTimestamps();
    }
}
