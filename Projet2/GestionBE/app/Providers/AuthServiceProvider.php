<?php

namespace App\Providers;

// use Illuminate\Support\Facades\Gate;

use App\Models\Client;
use App\Models\Commande;
use App\Models\Fournisseur;
use App\Models\Livreur;
use App\Models\Vehicule;
use App\Models\Produit;
use App\Models\Objectif;
use App\Models\User;
use App\Models\Employe;
use App\Models\Calendrie;
use App\Models\Horaire;
use App\Models\HorairePeriodique;
use App\Models\DetailMotifAbsence;
use App\Models\JourFeries;
use App\Models\Rubrique;
use App\Models\Constante;
use App\Models\GpGroupPaie;
use App\Models\BultinModel;
use App\Models\ThemeBultinModel;
use App\Models\AbsencePrevisionnel;
use App\Models\GpConge;
use App\Models\GpDemandeConge;
use App\Policies\ClientPolicy;
use App\Policies\CommandePolicy;
use App\Policies\LivreurPolicy;
use App\Policies\VehiculePolicy;
use App\Policies\FournisseurPolicy;
use App\Policies\ObjectifPolicy;
use App\Policies\ProductPolicy;
use App\Policies\UserPolicy;
use App\Policies\EmployePolicy;
use App\Policies\DetailMotifAbsencePolicy;
use App\Policies\JourFeriesPolicy;
use App\Policies\CalendriePolicy;
use App\Policies\HorairePolicy;
use App\Policies\HorairePeriodiquePolicy;
use App\Policies\RubriquePolicy;
use App\Policies\ConstantePolicy;
use App\Policies\GpGroupPaiePolicy;
use App\Policies\BultinModelPolicy;
use App\Policies\ThemeBultinModelPolicy;
use App\Policies\AbsencePrevisionnelPolicy;
use App\Policies\GpCongePolicy;
use App\Policies\GpDemandeCongePolicy;
use App\Policies\SocietePolicy;
use App\Policies\BonDeSortiePolicy;
use App\Policies\RegleCompensationPolicy;
use App\Policies\PenalitePolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use App\Policies\ArrondiPolicy;
use App\Policies\ParametreBasePolicy;
use App\Policies\HeureTravailPolicy;
use App\Policies\HoraireExceptionnelPolicy;
use App\Policies\DepartementPolicy;
use App\Models\Departement;
use App\Policies\GroupMotifAbsencePolicy;
use App\Policies\GroupeHorairePolicy;
use App\Policies\GroupConstantePolicy;
use App\Models\GroupMotifAbsence;
use App\Models\GroupeHoraire;
use App\Models\GroupConstante;
use App\Policies\GroupRubriquePolicy;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        User::class => UserPolicy::class,
        Produit::class => ProductPolicy::class,
        Commande::class => CommandePolicy::class,
        Client::class => ClientPolicy::class,
        Fournisseur::class => FournisseurPolicy::class,
        Vehicule::class => VehiculePolicy::class,
        Livreur::class => LivreurPolicy::class,
        Objectif::class => ObjectifPolicy::class,
        Commande::class => CommandePolicy::class,
        Employe::class => EmployePolicy::class,
        \App\Models\EmployeeHistory::class => \App\Policies\EmployeeHistoryPolicy::class,
        \App\Models\Contrat::class => \App\Policies\ContratPolicy::class,
        DetailMotifAbsence::class => DetailMotifAbsencePolicy::class,
        JourFeries::class => JourFeriesPolicy::class,
        \App\Models\Calendrie::class => \App\Policies\CalendriePolicy::class,
        \App\Models\Horaire::class => \App\Policies\HorairePolicy::class,
        \App\Models\HorairePeriodique::class => \App\Policies\HorairePeriodiquePolicy::class,
        Rubrique::class => RubriquePolicy::class,
        Constante::class => ConstantePolicy::class,
        GpGroupPaie::class => GpGroupPaiePolicy::class,
        BultinModel::class => BultinModelPolicy::class,
        ThemeBultinModel::class => ThemeBultinModelPolicy::class,
        AbsencePrevisionnel::class => AbsencePrevisionnelPolicy::class,
        GpConge::class => GpCongePolicy::class,
        GpDemandeConge::class => GpDemandeCongePolicy::class,
        \App\Models\Societe::class => SocietePolicy::class,
        \App\Models\GpBonSortie::class => BonDeSortiePolicy::class,
        \App\Models\RegleCompensation::class => RegleCompensationPolicy::class,
        \App\Models\Penalite::class => PenalitePolicy::class,
        \App\Models\Arrondi::class => ArrondiPolicy::class,
        \App\Models\ParametreBase::class => ParametreBasePolicy::class,
        \App\Models\HeureTravail::class => HeureTravailPolicy::class,
        \App\Models\HoraireExceptionnel::class => HoraireExceptionnelPolicy::class,
        Departement::class => DepartementPolicy::class,
        // Group models → policies (if models exist)
        // GroupMotifAbsence::class => GroupMotifAbsencePolicy::class,
        // GroupeHoraire::class => GroupeHorairePolicy::class,
        // GroupConstante::class => GroupConstantePolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();

        Gate::define('view_all_products', 'App\Policies\ProductPolicy@viewAllProducts');
        Gate::define('create_product', 'App\Policies\ProductPolicy@createProduct');
        Gate::define('view_product', 'App\Policies\ProductPolicy@viewProduct');
        Gate::define('edit_product', 'App\Policies\ProductPolicy@editProduct');
        Gate::define('delete_product', 'App\Policies\ProductPolicy@deleteProduct');

        Gate::define('view_all_clients', 'App\Policies\ClientPolicy@viewAllClients');
        Gate::define('create_clients', 'App\Policies\ClientPolicy@createClient');
        Gate::define('view_clients', 'App\Policies\ClientPolicy@viewClients');
        Gate::define('update_clients', 'App\Policies\ClientPolicy@editClient');
        Gate::define('delete_clients', 'App\Policies\ClientPolicy@deleteClient');

        Gate::define('view_all_fournisseurs', 'App\Policies\FournisseurPolicy@viewAllFournisseurs');
        Gate::define('create_fournisseurs', 'App\Policies\FournisseurPolicy@createFournisseur');
        Gate::define('view_fournisseurs', 'App\Policies\FournisseurPolicy@viewFournisseur');
        Gate::define('update_fournisseurs', 'App\Policies\FournisseurPolicy@editFournisseur');
        Gate::define('delete_fournisseurs', 'App\Policies\FournisseurPolicy@deleteFournisseur');

        Gate::define('view_all_livreurs', 'App\Policies\LivreurPolicy@viewAllLivreurs');
        Gate::define('create_livreurs', 'App\Policies\LivreurPolicy@createLivreur');
        Gate::define('view_livreurs', 'App\Policies\LivreurPolicy@viewLivreur');
        Gate::define('update_livreurs', 'App\Policies\LivreurPolicy@editLivreur');
        Gate::define('delete_livreurs', 'App\Policies\LivreurPolicy@deleteLivreur');


        Gate::define('view_all_vehicules', 'App\Policies\VehiculePolicy@viewAllVehicules');
        Gate::define('create_vehicules', 'App\Policies\VehiculePolicy@createVehicule');
        Gate::define('view_vehicules', 'App\Policies\VehiculePolicy@viewVehicule');
        Gate::define('update_vehicules', 'App\Policies\VehiculePolicy@editVehicule');
        Gate::define('delete_vehicules', 'App\Policies\VehiculePolicy@deleteVehicule');

        Gate::define('view_all_objectifs', 'App\Policies\ObjectifPolicy@viewAllObjectifs');
        Gate::define('create_objectifs', 'App\Policies\ObjectifPolicy@createObjectif');
        Gate::define('view_objectifs', 'App\Policies\ObjectifPolicy@viewObjectif');
        Gate::define('update_objectifs', 'App\Policies\ObjectifPolicy@editObjectif');
        Gate::define('delete_objectifs', 'App\Policies\ObjectifPolicy@deleteObjectif');

        Gate::define('view_all_commandes', 'App\Policies\CommandePolicy@viewAllCommandes');
        Gate::define('create_commandes', 'App\Policies\CommandePolicy@createCommande');
        Gate::define('view_commandes', 'App\Policies\CommandePolicy@viewCommande');
        Gate::define('update_commandes', 'App\Policies\CommandePolicy@editCommande');
        Gate::define('delete_commandes', 'App\Policies\CommandePolicy@deleteCommande');


        Gate::define('view_all_users', 'App\Policies\UserPolicy@viewAllUsers');
        Gate::define('create_user', 'App\Policies\UserPolicy@createUser');
        Gate::define('view_user', 'App\Policies\UserPolicy@viewUser');
        Gate::define('edit_user', 'App\Policies\UserPolicy@editUser');
        Gate::define('delete_user', 'App\Policies\UserPolicy@deleteUser');

        // Permissions d'accès aux pages Employés
        Gate::define('view_emp_historique', function ($user) {
            return $user->hasPermission('view_emp_historique');
        });
        Gate::define('view_emp_contrats', function ($user) {
            return $user->hasPermission('view_emp_contrats');
        });

        Gate::define('view_all_employee_histories', 'App\\Policies\\EmployeeHistoryPolicy@viewAll');
        Gate::define('create_employee_histories', 'App\\Policies\\EmployeeHistoryPolicy@create');
        Gate::define('update_employee_histories', 'App\\Policies\\EmployeeHistoryPolicy@update');
        Gate::define('delete_employee_histories', 'App\\Policies\\EmployeeHistoryPolicy@delete');

        Gate::define('view_all_contrats', 'App\\Policies\\ContratPolicy@viewAll');
        Gate::define('create_contrats', 'App\\Policies\\ContratPolicy@create');
        Gate::define('update_contrats', 'App\\Policies\\ContratPolicy@update');
        Gate::define('delete_contrats', 'App\\Policies\\ContratPolicy@delete');

        Gate::define('view_all_employes', 'App\Policies\EmployePolicy@viewAllEmployes');
        Gate::define('create_employes', 'App\Policies\EmployePolicy@createEmploye');
        Gate::define('view_employes', 'App\Policies\EmployePolicy@viewEmploye');
        Gate::define('update_employes', 'App\Policies\EmployePolicy@editEmploye');
        Gate::define('delete_employes', 'App\Policies\EmployePolicy@deleteEmploye');

        // Absences (DetailMotifAbsence)
        Gate::define('view_all_absences', 'App\\Policies\\DetailMotifAbsencePolicy@viewAll');
        Gate::define('create_absences', 'App\\Policies\\DetailMotifAbsencePolicy@create');
        Gate::define('update_absences', 'App\\Policies\\DetailMotifAbsencePolicy@update');
        Gate::define('delete_absences', 'App\\Policies\\DetailMotifAbsencePolicy@delete');

        // Jours Fériés
        Gate::define('view_all_jour_feries', 'App\\Policies\\JourFeriesPolicy@viewAll');
        Gate::define('create_jour_feries', 'App\\Policies\\JourFeriesPolicy@create');
        Gate::define('update_jour_feries', 'App\\Policies\\JourFeriesPolicy@update');
        Gate::define('delete_jour_feries', 'App\\Policies\\JourFeriesPolicy@delete');

        Gate::define('view_all_calendries', 'App\\Policies\\CalendriePolicy@viewAll');
        Gate::define('create_calendries', 'App\\Policies\\CalendriePolicy@create');
        Gate::define('update_calendries', 'App\\Policies\\CalendriePolicy@update');
        Gate::define('delete_calendries', 'App\\Policies\\CalendriePolicy@delete');

        Gate::define('view_all_horaires', 'App\\Policies\\HorairePolicy@viewAll');
        Gate::define('create_horaires', 'App\\Policies\\HorairePolicy@create');
        Gate::define('update_horaires', 'App\\Policies\\HorairePolicy@update');
        Gate::define('delete_horaires', 'App\\Policies\\HorairePolicy@delete');

        Gate::define('view_all_horaire_periodiques', 'App\\Policies\\HorairePeriodiquePolicy@viewAll');
        Gate::define('create_horaire_periodiques', 'App\\Policies\\HorairePeriodiquePolicy@create');
        Gate::define('update_horaire_periodiques', 'App\\Policies\\HorairePeriodiquePolicy@update');
        Gate::define('delete_horaire_periodiques', 'App\\Policies\\HorairePeriodiquePolicy@delete');

        // Rubriques
        Gate::define('view_all_rubriques', 'App\\Policies\\RubriquePolicy@viewAll');
        Gate::define('create_rubriques', 'App\\Policies\\RubriquePolicy@create');
        Gate::define('update_rubriques', 'App\\Policies\\RubriquePolicy@update');
        Gate::define('delete_rubriques', 'App\\Policies\\RubriquePolicy@delete');

        // Constantes
        Gate::define('view_all_constantes', 'App\\Policies\\ConstantePolicy@viewAll');
        Gate::define('create_constantes', 'App\\Policies\\ConstantePolicy@create');
        Gate::define('update_constantes', 'App\\Policies\\ConstantePolicy@update');
        Gate::define('delete_constantes', 'App\\Policies\\ConstantePolicy@delete');

        // Groupes Paie
        Gate::define('view_all_groupes_paie', 'App\\Policies\\GpGroupPaiePolicy@viewAll');
        Gate::define('create_groupes_paie', 'App\\Policies\\GpGroupPaiePolicy@create');
        Gate::define('update_groupes_paie', 'App\\Policies\\GpGroupPaiePolicy@update');
        Gate::define('delete_groupes_paie', 'App\\Policies\\GpGroupPaiePolicy@delete');

        // Bultin Models
        Gate::define('view_all_bultin_models', 'App\\Policies\\BultinModelPolicy@viewAll');
        Gate::define('create_bultin_models', 'App\\Policies\\BultinModelPolicy@create');
        Gate::define('update_bultin_models', 'App\\Policies\\BultinModelPolicy@update');
        Gate::define('delete_bultin_models', 'App\\Policies\\BultinModelPolicy@delete');

        // Theme Bultin Models
        Gate::define('view_all_theme_bultin_models', 'App\\Policies\\ThemeBultinModelPolicy@viewAll');
        Gate::define('create_theme_bultin_models', 'App\\Policies\\ThemeBultinModelPolicy@create');
        Gate::define('update_theme_bultin_models', 'App\\Policies\\ThemeBultinModelPolicy@update');
        Gate::define('delete_theme_bultin_models', 'App\\Policies\\ThemeBultinModelPolicy@delete');

        // Absence prévisionnel
        Gate::define('view_all_absence_previsionnels', 'App\\Policies\\AbsencePrevisionnelPolicy@viewAll');
        Gate::define('create_absence_previsionnels', 'App\\Policies\\AbsencePrevisionnelPolicy@create');
        Gate::define('update_absence_previsionnels', 'App\\Policies\\AbsencePrevisionnelPolicy@update');
        Gate::define('delete_absence_previsionnels', 'App\\Policies\\AbsencePrevisionnelPolicy@delete');

        // Gestion congé
        Gate::define('view_all_conges', 'App\\Policies\\GpCongePolicy@viewAll');
        Gate::define('create_conges', 'App\\Policies\\GpCongePolicy@create');
        Gate::define('update_conges', 'App\\Policies\\GpCongePolicy@update');
        Gate::define('delete_conges', 'App\\Policies\\GpCongePolicy@delete');

        // Demande congé
        Gate::define('view_all_demandes_conges', 'App\\Policies\\GpDemandeCongePolicy@viewAll');
        Gate::define('create_demandes_conges', 'App\\Policies\\GpDemandeCongePolicy@create');
        Gate::define('update_demandes_conges', 'App\\Policies\\GpDemandeCongePolicy@update');
        Gate::define('delete_demandes_conges', 'App\\Policies\\GpDemandeCongePolicy@delete');

        // Page-level permissions
        Gate::define('view_bulletin_paie', function ($user) { return $user->hasPermission('view_bulletin_paie'); });
        Gate::define('view_valeur_base', function ($user) { return $user->hasPermission('view_valeur_base'); });

        // === SOCIETE ===
        Gate::define('view_all_societes', 'App\\Policies\\SocietePolicy@view_all');
        Gate::define('create_societes', 'App\\Policies\\SocietePolicy@create');
        Gate::define('update_societes', 'App\\Policies\\SocietePolicy@update');
        Gate::define('delete_societes', 'App\\Policies\\SocietePolicy@delete');

        // === BON DE SORTIE ===
        Gate::define('view_all_bon_de_sortie', 'App\\Policies\\BonDeSortiePolicy@view_all');
        Gate::define('create_bon_de_sortie', 'App\\Policies\\BonDeSortiePolicy@create');
        Gate::define('update_bon_de_sortie', 'App\\Policies\\BonDeSortiePolicy@update');
        Gate::define('delete_bon_de_sortie', 'App\\Policies\\BonDeSortiePolicy@delete');

        // === REGLE COMPENSATION ===
        Gate::define('view_all_regle_compensation', 'App\\Policies\\RegleCompensationPolicy@view_all');
        Gate::define('create_regle_compensation', 'App\\Policies\\RegleCompensationPolicy@create');
        Gate::define('update_regle_compensation', 'App\\Policies\\RegleCompensationPolicy@update');
        Gate::define('delete_regle_compensation', 'App\\Policies\\RegleCompensationPolicy@delete');

        // === PENALITE ===
        Gate::define('view_all_penalites', 'App\\Policies\\PenalitePolicy@view_all');
        Gate::define('create_penalites', 'App\\Policies\\PenalitePolicy@create');
        Gate::define('update_penalites', 'App\\Policies\\PenalitePolicy@update');
        Gate::define('delete_penalites', 'App\\Policies\\PenalitePolicy@delete');

        // === ARRONDI ===
        Gate::define('view_all_arrondis', 'App\\Policies\\ArrondiPolicy@view_all');
        Gate::define('create_arrondis', 'App\\Policies\\ArrondiPolicy@create');
        Gate::define('update_arrondis', 'App\\Policies\\ArrondiPolicy@update');
        Gate::define('delete_arrondis', 'App\\Policies\\ArrondiPolicy@delete');
        // === PARAMETRE BASE ===
        Gate::define('view_all_parametre_base', 'App\\Policies\\ParametreBasePolicy@view_all');
        Gate::define('create_parametre_base', 'App\\Policies\\ParametreBasePolicy@create');
        Gate::define('update_parametre_base', 'App\\Policies\\ParametreBasePolicy@update');
        Gate::define('delete_parametre_base', 'App\\Policies\\ParametreBasePolicy@delete');
        // === HEURE TRAVAIL ===
        Gate::define('view_all_heure_travail', 'App\\Policies\\HeureTravailPolicy@view_all');
        Gate::define('create_heure_travail', 'App\\Policies\\HeureTravailPolicy@create');
        Gate::define('update_heure_travail', 'App\\Policies\\HeureTravailPolicy@update');
        Gate::define('delete_heure_travail', 'App\\Policies\\HeureTravailPolicy@delete');
        // === HORAIRE EXCEPTIONNEL ===
        Gate::define('view_all_horaire_exceptionnel', 'App\\Policies\\HoraireExceptionnelPolicy@view_all');
        Gate::define('create_horaire_exceptionnel', 'App\\Policies\\HoraireExceptionnelPolicy@create');
        Gate::define('update_horaire_exceptionnel', 'App\\Policies\\HoraireExceptionnelPolicy@update');
        Gate::define('delete_horaire_exceptionnel', 'App\\Policies\\HoraireExceptionnelPolicy@delete');

        // === DEPARTEMENT ===
        Gate::define('view_all_departements', 'App\\Policies\\DepartementPolicy@viewAll');
        Gate::define('create_departements', 'App\\Policies\\DepartementPolicy@create');
        Gate::define('update_departements', 'App\\Policies\\DepartementPolicy@update');
        Gate::define('delete_departements', 'App\\Policies\\DepartementPolicy@delete');

        // === GROUPES (Absence) ===
        Gate::define('view_all_group_motifs', 'App\\Policies\\GroupMotifAbsencePolicy@viewAll');
        Gate::define('create_group_motifs', 'App\\Policies\\GroupMotifAbsencePolicy@create');
        Gate::define('update_group_motifs', 'App\\Policies\\GroupMotifAbsencePolicy@update');
        Gate::define('delete_group_motifs', 'App\\Policies\\GroupMotifAbsencePolicy@delete');

        // === GROUPES (Horaires) ===
        Gate::define('view_all_groupe_horaires', 'App\\Policies\\GroupeHorairePolicy@viewAll');
        Gate::define('create_groupe_horaires', 'App\\Policies\\GroupeHorairePolicy@create');
        Gate::define('update_groupe_horaires', 'App\\Policies\\GroupeHorairePolicy@update');
        Gate::define('delete_groupe_horaires', 'App\\Policies\\GroupeHorairePolicy@delete');

        // === GROUPES (Constantes) ===
        Gate::define('view_all_group_constantes', 'App\\Policies\\GroupConstantePolicy@viewAll');
        Gate::define('create_group_constantes', 'App\\Policies\\GroupConstantePolicy@create');
        Gate::define('update_group_constantes', 'App\\Policies\\GroupConstantePolicy@update');
        Gate::define('delete_group_constantes', 'App\\Policies\\GroupConstantePolicy@delete');

        // === GROUPES (Rubriques) ===
        Gate::define('view_all_group_rubriques', 'App\\Policies\\GroupRubriquePolicy@viewAll');
        Gate::define('create_group_rubriques', 'App\\Policies\\GroupRubriquePolicy@create');
        Gate::define('update_group_rubriques', 'App\\Policies\\GroupRubriquePolicy@update');
        Gate::define('delete_group_rubriques', 'App\\Policies\\GroupRubriquePolicy@delete');

        // === DETAILS - Groupes Paie ===
        Gate::define('view_groupes_paie_details', function ($user) { return $user->hasPermission('view_groupes_paie_details'); });
        Gate::define('create_groupes_paie_details', function ($user) { return $user->hasPermission('create_groupes_paie_details'); });
        Gate::define('update_groupes_paie_details', function ($user) { return $user->hasPermission('update_groupes_paie_details'); });
        Gate::define('delete_groupes_paie_details', function ($user) { return $user->hasPermission('delete_groupes_paie_details'); });

        // === DETAILS - Bulletins Modèles ===
        Gate::define('view_bultin_models_details', function ($user) { return $user->hasPermission('view_bultin_models_details'); });
        Gate::define('create_bultin_models_details', function ($user) { return $user->hasPermission('create_bultin_models_details'); });
        Gate::define('update_bultin_models_details', function ($user) { return $user->hasPermission('update_bultin_models_details'); });
        Gate::define('delete_bultin_models_details', function ($user) { return $user->hasPermission('delete_bultin_models_details'); });
    }
}
