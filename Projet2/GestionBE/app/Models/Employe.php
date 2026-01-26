<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;




class Employe extends Model
{
    protected $fillable = [
           'matricule',
           'num_badge',
           'nom',
           'prenom',
           'lieu_naiss',
           'date_naiss',
           'cin',
           'cnss',
           'sexe',
           'situation_fm',
           'nb_enfants',
           'adresse',
           'ville',
           'pays',
           'code_postal',
           'tel',
           'fax',
           'email',
           'fonction',
           'nationalite',
           'niveau',
            'echelon',
            'categorie',
            'coeficients',
            'imputation',
            'date_entree',
            'date_embauche',
            'date_sortie',
            'salaire_base',
            'remarque',
            // 'pointage_auto',
            // 'regle_paiment',
            // 'famille_jour_ferie',
            // 'code_cal',
            'url_img',
            // 'numorder',
            // 'afficherEtats',
            'centreCout',
            'departement_id',
            'active',
            'delivree_par', 'date_expiration', 'carte_sejour', 'motif_depart',
            'dernier_jour_travaille', 'notification_rupture', 'engagement_procedure',
            'signature_rupture_conventionnelle', 'transaction_en_cours', 'bulletin_modele',
            'salaire_moyen', 'salaire_reference_annuel'
        
    ];
    public function departements()
{
    return $this->belongsToMany(Departement::class, 'employe_departement', 'employe_id', 'departement_id');
}
public function contrat()
    {
        return $this->hasMany(Contrat::class);
    }


    public function calendriersEmployes()
    {
        return $this->hasMany(GpCalendrierEmploye::class, 'employe_id');
    }

    public function bulletins()
    {
        return $this->hasMany(GpEmployeBulletin::class, 'employe_id');
    }

    public function bonSortie()
    {
        return $this->hasMany(GpBonSortie::class, 'employee_id');
    }
    public function gpConge()
{
    return $this->hasOne(GpConge::class, 'employe_id');
}
public function demandesConges()
{
    return $this->hasMany(GpDemandeConge::class, 'employe_id');
}





protected static function booted()
{
    static::created(function ($employe) {
        try {
            Log::info('[Employe booted] Début création gp_conges', [
                'employe_id'     => $employe->id,
                'date_embauche'  => $employe->date_embauche,
            ]);

            if ($employe->date_embauche) {
                $dateEmbauche = \Carbon\Carbon::parse($employe->date_embauche);
                $mois = now()->diffInMonths($dateEmbauche);

                $joursCumules = $mois * 1.5;

                $employe->gpConge()->create([
                    'jours_cumules' => $joursCumules,
                    'jours_consomes'=> 0,
                    'solde_actuel'  => $joursCumules,
                    'last_update'   => now(),
                ]);

                Log::info('[Employe booted] gp_conges créé avec succès', [
                    'employe_id'    => $employe->id,
                    'jours_cumules' => $joursCumules,
                    'solde_actuel'  => $joursCumules,
                ]);
            } else {
                Log::warning('[Employe booted] Pas de date_embauche, gp_conges non créé', [
                    'employe_id' => $employe->id,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('[Employe booted] Erreur lors de la création de gp_conges', [
                'employe_id' => $employe->id,
                'message'    => $e->getMessage(),
                'stack'      => $e->getTraceAsString(),
            ]);
        }
    });
}




}


