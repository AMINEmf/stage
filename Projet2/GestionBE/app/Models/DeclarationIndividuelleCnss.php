<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DeclarationIndividuelleCnss extends Model
{
    use HasFactory;

    protected $table = 'declarations_individuelles_cnss';

    protected $fillable = [
        'employe_id',
        'mois',
        'annee',
        'jours_travailles',
        'salaire_brut_imposable',
        'base_plafonnee',
        'cotisation_salarie',
        'cotisation_patronale',
        'statut',
    ];

    protected $casts = [
        'mois'                  => 'integer',
        'annee'                 => 'integer',
        'jours_travailles'      => 'integer',
        'salaire_brut_imposable'=> 'float',
        'base_plafonnee'        => 'float',
        'cotisation_salarie'    => 'float',
        'cotisation_patronale'  => 'float',
    ];

    // ─── Calcul CNSS ────────────────────────────────────────────────────────────
    public static function calculerCotisations(float $salaireBrut): array
    {
        $plafond = 6000.0;
        $basePlafonnee = min($salaireBrut, $plafond);

        $cotisationSalarie   = round(($basePlafonnee * 0.0429) + ($salaireBrut * 0.0226), 2);
        $cotisationPatronale = round(($basePlafonnee * 0.0898) + ($salaireBrut * 0.1211), 2);

        return [
            'base_plafonnee'        => round($basePlafonnee, 2),
            'cotisation_salarie'    => $cotisationSalarie,
            'cotisation_patronale'  => $cotisationPatronale,
        ];
    }

    // ─── Relations ──────────────────────────────────────────────────────────────
    public function employe()
    {
        return $this->belongsTo(Employe::class, 'employe_id');
    }
}
