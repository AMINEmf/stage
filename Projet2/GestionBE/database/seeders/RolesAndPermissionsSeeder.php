<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run()
    {
        // Créer ou récupérer le rôle admin
        $adminRole = Role::firstOrCreate(['name' => 'admin']);

        // Créer des permissions pour la table des produits
        $AdminPermissions = [
            'view_all_products',
            'create_product',
            'edit_product',
            'delete_product',
            // 'view_product',
            'view_all_livreurs',
            'create_livreurs',
            'update_livreurs',
            'delete_livreurs',
            'delete_fournisseurs',
            'update_fournisseurs',
            // 'view_fournisseurs',
            'create_fournisseurs',
            'view_all_fournisseurs',
            'delete_user',
            'edit_user',
            // 'view_user',
            'create_user',
            'view_all_users',
            'delete_clients',
            // 'view_clients',
            'update_clients',
            'view_all_clients',
            'create_clients',
            'view_all_vehicules',
            'update_vehicules',
            'create_vehicules',
            'delete_vehicules',
            'view_all_objectifs',
            'create_objectifs',
            'update_objectifs',
            'delete_objectifs',
            'view_all_commandes',
            'create_commandes',
            'update_commandes',
            'delete_commandes',
            // 'view_all_employes',
            'view_all_employes',
            'create_employes',
            'update_employes',
            'delete_employes',
            // Permissions spécifiques aux pages Employés
            'view_emp_historique',
            'view_emp_contrats',
            // CRUD historiques employés (modèle)
            'view_all_employee_histories',
            'create_employee_histories',
            'update_employee_histories',
            'delete_employee_histories',
            // CRUD contrats (modèle)
            'view_all_contrats',
            'create_contrats',
            'update_contrats',
            'delete_contrats',
            // Absences (DetailMotifAbsence)
            'view_all_absences',
            'create_absences',
            'update_absences',
            'delete_absences',
            // Jours fériés
            'view_all_jour_feries',
            'create_jour_feries',
            'update_jour_feries',
            'delete_jour_feries',

            // Calendries
           'view_all_calendries',
           'create_calendries',
           'update_calendries',
           'delete_calendries',

           // Horaires
          'view_all_horaires',
          'create_horaires',
          'update_horaires',
          'delete_horaires',

          // Horaires périodiques
          'view_all_horaire_periodiques',
          'create_horaire_periodiques',
          'update_horaire_periodiques',
          'delete_horaire_periodiques',

            // Rubriques
            'view_all_rubriques',
            'create_rubriques',
            'update_rubriques',
            'delete_rubriques',

            // Constantes
            'view_all_constantes',
            'create_constantes',
            'update_constantes',
            'delete_constantes',

            // Groupes Paie
            'view_all_groupes_paie',
            'create_groupes_paie',
            'update_groupes_paie',
            'delete_groupes_paie',

            // Bulletins modèles
            'view_all_bultin_models',
            'create_bultin_models',
            'update_bultin_models',
            'delete_bultin_models',

            // Thèmes bulletin modèle
            'view_all_theme_bultin_models',
            'create_theme_bultin_models',
            'update_theme_bultin_models',
            'delete_theme_bultin_models',

            // Absences prévisionnelles
            'view_all_absence_previsionnels',
            'create_absence_previsionnels',
            'update_absence_previsionnels',
            'delete_absence_previsionnels',

            // Gestion congé
            'view_all_conges',
            'create_conges',
            'update_conges',
            'delete_conges',

            // Demandes de congé
            'view_all_demandes_conges',
            'create_demandes_conges',
            'update_demandes_conges',
            'delete_demandes_conges',

            // Pages
            'view_bulletin_paie',
            'view_valeur_base',

            // SOCIETE
            'view_all_societes',
            'create_societes',
            'update_societes',
            'delete_societes',
            // BON DE SORTIE
            'view_all_bon_de_sortie',
            'create_bon_de_sortie',
            'update_bon_de_sortie',
            'delete_bon_de_sortie',
            // REGLE COMPENSATION
            'view_all_regle_compensation',
            'create_regle_compensation',
            'update_regle_compensation',
            'delete_regle_compensation',
            // PENALITE
            'view_all_penalites',
            'create_penalites',
            'update_penalites',
            'delete_penalites',
            // ARRONDI
            'view_all_arrondis',
            'create_arrondis',
            'update_arrondis',
            'delete_arrondis',
            // PARAMETRE BASE
            'view_all_parametre_base',
            'create_parametre_base',
            'update_parametre_base',
            'delete_parametre_base',
            // HEURE TRAVAIL
            'view_all_heure_travail',
            'create_heure_travail',
            'update_heure_travail',
            'delete_heure_travail',
            // HORAIRE EXCEPTIONNEL
            'view_all_horaire_exceptionnel',
            'create_horaire_exceptionnel',
            'update_horaire_exceptionnel',
            'delete_horaire_exceptionnel',

            // Departements
            'view_all_departements',
            'create_departements',
            'update_departements',
            'delete_departements',

            // Groupes - Motif Absence
            'view_all_group_motifs',
            'create_group_motifs',
            'update_group_motifs',
            'delete_group_motifs',

            // Groupes - Horaires
            'view_all_groupe_horaires',
            'create_groupe_horaires',
            'update_groupe_horaires',
            'delete_groupe_horaires',

            // Groupes - Constantes
            'view_all_group_constantes',
            'create_group_constantes',
            'update_group_constantes',
            'delete_group_constantes',

            // Groupes - Rubriques
            'view_all_group_rubriques',
            'create_group_rubriques',
            'update_group_rubriques',
            'delete_group_rubriques',

            // Détails Groupes Paie
            'view_groupes_paie_details',
            'create_groupes_paie_details',
            'update_groupes_paie_details',
            'delete_groupes_paie_details',

            // Détails Bulletins Modèles
            'view_bultin_models_details',
            'create_bultin_models_details',
            'update_bultin_models_details',
            'delete_bultin_models_details',

        ];
        foreach ($AdminPermissions as $permission) {
            $perm = Permission::firstOrCreate(['name' => $permission]);
            // Attach permission to role if not already attached
            if (!$adminRole->permissions()->where('name', $permission)->exists()) {
                $adminRole->permissions()->syncWithoutDetaching([$perm->id]);
            }
        }

        // Créer ou récupérer un utilisateur admin et lui assigner le rôle
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Admin User',
                'password' => 'admin1234',
            ]
        );
        if (!$adminUser->roles()->where('roles.id', $adminRole->id)->exists()) {
            $adminUser->assignRole($adminRole);
        }

        // Créer un utilisateur avec le rôle utilisateur et la permission view_all_products
        // $userRole = Role::create(['name' => 'utilisateur']);
        // $viewAllProductsPermission = Permission::create(['name' => 'view_all_products']);
        // $userRole->givePermissionTo('view_all_products');

        // $regularUser = User::create([
        //     'name' => 'Regular User',
        //     'email' => 'user@example.com',
        //   'password' => 'password',
        // ]);
        // $regularUser->assignRole($userRole);
    }
}
