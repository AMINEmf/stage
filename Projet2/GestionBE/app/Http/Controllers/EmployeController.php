<?php

namespace App\Http\Controllers;

use App\Models\Employe;
use App\Models\EmployeeHistory;
use App\Models\EmployeDepartement;
use App\Models\Departement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use App\Imports\EmployesImport;
use Maatwebsite\Excel\Facades\Excel;



class EmployeController extends Controller
{

    public function index()
    {
        Log::info('Request to fetch employees received.'); // Added logging
        // if (Gate::allows('view_all_employes')) {
            $employes = Employe::with('departements', 'contrat')->get();
            Log::info('Employees found: ' . $employes->count());
            return response()->json($employes);
        // } else {
        //     abort(403, 'Vous n\'avez pas l\'autorisation de voir la liste des employés.');
        // }
    }

    /**
     * Endpoint léger pour récupérer la liste des employés (sans relations lourdes)
     * Utilisé par AccidentTable, CimrTable, etc. pour les filtres
     */
    public function listLight()
    {
        return Employe::select('id', 'nom', 'prenom', 'matricule', 'departement_id', 'cin', 'fonction', 'date_entree')
            ->where('active', 1)
            ->get();
    }





    public function getDashboardStats()
    {
        try {
            $totalEmployees = Employe::where('active', 1)->count();
            $femmes = Employe::where('active', 1)->where('sexe', 'female')->count();
            $hommes = Employe::where('active', 1)->where('sexe', 'male')->count();
            
            return response()->json([
                'totalEmployees' => $totalEmployees,
                'femmes' => $femmes,
                'hommes' => $hommes
            ]);
        } catch (\Exception $e) {
            Log::error('Erreur lors de la récupération des statistiques du dashboard : ' . $e->getMessage());
            return response()->json([
                'error' => 'Une erreur s\'est produite lors de la récupération des statistiques'
            ], 500);
        }
    }






    
    // public function store(Request $request)
    // { 
    //     // Log des données brutes reçues
    //     Log::info('Requête reçue pour création d\'employé : ', $request->all());
    
    //     $validatedData = $request->validate([
    //         'matricule' => 'nullable|string|max:255',
    //         'num_badge' => 'nullable|string|max:255',
    //         'nom' => 'required|string|max:255',
    //         'prenom' => 'required|string|max:255',
    //         'lieu_naiss' => 'nullable|string|max:255',
    //         'date_naiss' => 'nullable|date',
    //         'cin' => 'nullable|string|max:255',
    //         'cnss' => 'nullable|string|max:255',
    //         'sexe' => 'nullable|string|max:50',
    //         'situation_fm' => 'nullable|string|max:255',
    //         'nb_enfants' => 'nullable|integer',
    //         'adresse' => 'nullable|string|max:255',
    //         'ville' => 'nullable|string|max:255',
    //         'pays' => 'nullable|string|max:255',
    //         'code_postal' => 'nullable|string|max:20',
    //         'tel' => 'nullable|string|max:20',
    //         'fax' => 'nullable|string|max:20',
    //         'email' => 'nullable|string|email|max:35',
    //         'fonction' => 'nullable|string|max:255',
    //         'nationalite' => 'nullable|string|max:255',
    //         'niveau' => 'nullable|string|max:255',
    //         'echelon' => 'nullable|string|max:255',
    //         'categorie' => 'nullable|string|max:255',
    //         'coeficients' => 'nullable|string|max:255',
    //         'imputation' => 'nullable|string|max:255',
    //         'date_entree' => 'nullable|date',
    //         'date_embauche' => 'nullable|date',
    //         'date_sortie' => 'nullable|date',
    //         'salaire_base' => 'nullable|numeric',
    //         'remarque' => 'nullable|string',
    //         'url_img' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
    //         'centreCout' => 'nullable|string|max:255',
    //         'departement_id' => 'nullable|exists:departements,id',
    //         'delivree_par' => 'nullable|string|max:255',
    //         'date_expiration' => 'nullable|date',
    //         'carte_sejour' => 'nullable|string|max:255',
    //         'motif_depart' => 'nullable|string|max:255',
    //         'dernier_jour_travaille' => 'nullable|date',
    //         'notification_rupture' => 'nullable|date',
    //         'engagement_procedure' => 'nullable|date',
    //         'signature_rupture_conventionnelle' => 'nullable|date',
    //         'transaction_en_cours' => 'nullable|boolean',
    //         'bulletin_modele' => 'nullable|string',
    //         'salaire_moyen' => 'nullable|numeric',
    //         'salaire_reference_annuel' => 'nullable|numeric',
    //     ]);
    
    //     Log::info('Données validées pour création d\'employé : ', $validatedData);
    
    //     try {
    //         DB::beginTransaction();
    
    //         $employeData = $validatedData;
    //         $employeData['active'] = 1;
    
    //         if ($request->hasFile('url_img')) {
    //             $imagePath = $request->file('url_img')->store('employee_images', 'public');
    //             $employeData['url_img'] = $imagePath;
    
    //             Log::info('Image enregistrée à : ' . $imagePath);
    //         }
    
    //         $employe = Employe::create($employeData);
    
    //         Log::info('Employé enregistré en base de données : ', $employe->toArray());
    
    //         if ($request->departement_id) {
    //             $employeDepartementController = new EmployeDepartementController();
    //             $employeDepartementController->store(new Request([
    //                 'employe_id' => $employe->id,
    //                 'departement_id' => $request->departement_id,
    //                 'date_début' => $employeData['date_entree'] ?? now()->toDateString()
    //             ]));
    
    //             Log::info("Département associé à l'employé : " . $request->departement_id);
    //         }
    
    //         DB::commit();
    
    //         return response()->json($employe->load('departements.parent'), 201);
    //     } catch (\Exception $e) {
    //         DB::rollBack();
    


    //         Log::error('Erreur lors de la création de l\'employé : ' . $e->getMessage(), [
    //             'stack' => $e->getTraceAsString()
    //         ]);
    
    //         return response()->json([
    //             'error' => 'Une erreur s\'est produite lors de la création de l\'employé : ' . $e->getMessage()
    //         ], 500);
    //     }
    // }
    



    public function store(Request $request)
    { 
        if (Gate::allows('create_employes')) {
            

        Log::info('Requête reçue pour création d\'employé : ', $request->all());
    
        $validatedData = $request->validate([
            'matricule' => 'nullable|string|max:255',
            'num_badge' => 'nullable|string|max:255',
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'lieu_naiss' => 'nullable|string|max:255',
            'date_naiss' => 'nullable|date',
            'cin' => 'nullable|string|max:255',
            'cnss' => 'nullable|string|max:255',
            'sexe' => 'nullable|string|max:50',
            'situation_fm' => 'nullable|string|max:255',
            'nb_enfants' => 'nullable|integer',
            'adresse.ville' => 'nullable|string|max:255',
             'adresse.pays' => 'nullable|string|max:255',
'adresse.codePostal' => 'nullable|string|max:20',
'adresse.commune' => 'nullable|string|max:255',
'adresse.codePays' => 'nullable|string|max:10',
            'tel' => 'nullable|string|max:20',
            'fax' => 'nullable|string|max:20',
            'email' => 'nullable|string|email|max:35',
            'fonction' => 'nullable|string|max:255',
            'nationalite' => 'nullable|string|max:255',
            'niveau' => 'nullable|string|max:255',
            'echelon' => 'nullable|string|max:255',
            'categorie' => 'nullable|string|max:255',
            'coeficients' => 'nullable|string|max:255',
            'imputation' => 'nullable|string|max:255',
            'date_entree' => 'nullable|date',
            'date_embauche' => 'nullable|date',
            'date_sortie' => 'nullable|date',
            'salaire_base' => 'nullable|numeric',
            'remarque' => 'nullable|string',
            'url_img' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'centreCout' => 'nullable|string|max:255',
            'departement_id' => 'nullable|exists:departements,id',
            'delivree_par' => 'nullable|string|max:255',
            'date_expiration' => 'nullable|date',
            'carte_sejour' => 'nullable|string|max:255',
            'motif_depart' => 'nullable|string|max:255',
            'dernier_jour_travaille' => 'nullable|date',
            'notification_rupture' => 'nullable|date',
            'engagement_procedure' => 'nullable|date',
            'signature_rupture_conventionnelle' => 'nullable|date',
            'transaction_en_cours' => 'nullable|boolean',
            'bulletin_modele' => 'nullable|string',
            'salaire_moyen' => 'nullable|numeric',
            'salaire_reference_annuel' => 'nullable|numeric',
        ]);
    
        Log::info('Données validées pour création d\'employé : ', $validatedData);
    
        try {
            DB::beginTransaction();
    
            $employeData = $validatedData;
            $employeData['active'] = 1;

            $employeData['ville'] = $request->input('adresse.ville');
            $employeData['pays'] = $request->input('adresse.pays');
            $employeData['code_postal'] = $request->input('adresse.codePostal');
            $employeData['commune'] = $request->input('adresse.commune');
            $employeData['code_pays'] = $request->input('adresse.codePays');



            $employeData['salaire_base'] = $request->input('salaire.salaire_base');
            $employeData['salaire_moyen'] = $request->input('salaire.salaire_moyen');
            $employeData['salaire_reference_annuel'] = $request->input('salaire.salaire_reference_annuel');


            if (isset($employeData['adresse'])) {
                unset($employeData['adresse']);
            }

            
            if ($request->hasFile('url_img')) {
                $imagePath = $request->file('url_img')->store('employee_images', 'public');
                $employeData['url_img'] = $imagePath;
    
                Log::info('Image enregistrée à : ' . $imagePath);
            }
    
            $employe = Employe::create($employeData);
    
            Log::info('Employé enregistré en base de données : ', $employe->toArray());
    
            if ($request->departement_id) {
                $employeDepartementController = new EmployeDepartementController();
                $employeDepartementController->store(new Request([
                    'employe_id' => $employe->id,
                    'departement_id' => $request->departement_id,
                    'date_début' => $employeData['date_entree'] ?? now()->toDateString()
                ]));
    
                Log::info("Département associé à l'employé : " . $request->departement_id);
            }
    
            DB::commit();
    
            return response()->json($employe->load('departements.parent'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
    


            Log::error('Erreur lors de la création de l\'employé : ' . $e->getMessage(), [
                'stack' => $e->getTraceAsString()
            ]);
    
            return response()->json([
                'error' => 'Une erreur s\'est produite lors de la création de l\'employé : ' . $e->getMessage()
            ], 500);
        }
    } else {
        abort(403, 'Vous n\'avez pas l\'autorisation de créer un employé.');
    }

    }




    
    
    public function show(Employe $employe)
    {
        return response()->json($employe->load('departements','contrat'));
    }




    public function update(Request $request, Employe $employe)
    {
        if (Gate::allows('update_employes')) {

        $validatedData = $request->validate([
            'matricule' => 'nullable|string|max:255',
            'num_badge' => 'nullable|string|max:255',
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'lieu_naiss' => 'nullable|string|max:255',
            'date_naiss' => 'nullable|date',
            'cin' => 'nullable|string|max:255',
            'cnss' => 'nullable|string|max:255',
            'sexe' => 'nullable|string|max:50',
            'situation_fm' => 'nullable|string|max:255',
            'nb_enfants' => 'nullable|integer',
            'adresse' => 'nullable|string|max:255',
            'ville' => 'nullable|string|max:255',
            'pays' => 'nullable|string|max:255',
            'code_postal' => 'nullable|string|max:20',
            'tel' => 'nullable|string|max:20',
            'fax' => 'nullable|string|max:20',
            'email' => 'nullable|string|email|max:35',
            'fonction' => 'nullable|string|max:255',
            'nationalite' => 'nullable|string|max:255',
            'niveau' => 'nullable|string|max:255',
            'echelon' => 'nullable|string|max:255',
            'categorie' => 'nullable|string|max:255',
            'coeficients' => 'nullable|string|max:255',
            'imputation' => 'nullable|string|max:255',
            'date_entree' => 'nullable|date',
            'date_embauche' => 'nullable|date',
            'date_sortie' => 'nullable|date',
            'salaire_base' => 'nullable|numeric',
            'remarque' => 'nullable|string',
            'url_img' => 'nullable',
            'centreCout' => 'nullable|string|max:255',
            'departement_id' => 'nullable|exists:departements,id', 
            'delivree_par' => 'nullable|string|max:255',
            'date_expiration' => 'nullable|date',
            'carte_sejour' => 'nullable|string|max:255',
            'motif_depart' => 'nullable|string|max:255',
            'dernier_jour_travaille' => 'nullable|date',
            'notification_rupture' => 'nullable|date',
            'engagement_procedure' => 'nullable|date',
            'signature_rupture_conventionnelle' => 'nullable|date',
            'transaction_en_cours' => 'nullable|boolean',
            'bulletin_modele' => 'nullable|string',
            'salaire_moyen' => 'nullable|numeric',
            'salaire_reference_annuel' => 'nullable|numeric',

        ]);
    
        try {
            $employeData = $validatedData;
            $employeData['active'] = 1; 
    
            if ($request->hasFile('url_img')) {
                $imagePath = $request->file('url_img')->store('employee_images', 'public');
                $employeData['url_img'] = $imagePath;
            }
    
            $employe->update($employeData);
            
            if ($request->departement_id) {
                $departement = Departement::find($request->departement_id);
                
                // تحديث السجل الحالي في تاريخ الموظف بدلاً من إنشاء سجل جديد
                $currentHistory = EmployeeHistory::where('employe_id', $employe->id)
                    ->whereNull('date_fin')
                    ->first();
    
                if ($currentHistory) {
                    $currentHistory->update([
                        'matricule' => $employe->matricule,
                        'nom' => $employe->nom,
                        'prenom' => $employe->prenom,
                        'departement_id' => $request->departement_id,
                        'departement_nom' => $departement->nom ?? '',
                        'date_début' => $employeData['date_entree'] ?? $currentHistory->date_début,
                        'action' => 'update'
                    ]);
                } else {

                    EmployeeHistory::create([
                        'matricule' => $employe->matricule,
                        'nom' => $employe->nom,
                        'prenom' => $employe->prenom,
                        'departement_id' => $request->departement_id,
                        'departement_nom' => $departement->nom ?? '',
                        'employe_id' => $employe->id,
                        'date_début' => $employeData['date_entree'] ?? now()->toDateString(),
                        'date_fin' => null,
                        'action' => 'update'
                    ]);
                }
    
                // تحديث العلاقة مع القسم
                $employe->departements()->sync([$request->departement_id => [
                    'date_début' => $employeData['date_entree'] ?? now()->toDateString()
                ]]);
            }
    
            return response()->json($employe->load('departements.parent'), 200);
        } catch (\Exception $e) {
            Log::error('Error updating employee', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'حدث خطأ أثناء تحديث الموظف: ' . $e->getMessage()], 500);
        }

    } else {
        abort(403, 'Vous n\'avez pas l\'autorisation de modifier un employé.');
    }

    }








    public function updateDepartement(Request $request)
    {
        try {
            $employeIds = $request->input('employeIds');
            $date_fin = $request->input('date_fin', now()->toDateString());

            DB::beginTransaction();

            foreach ($employeIds as $employeId) {
                $employe = Employe::find($employeId);
                
                if ($employe) {
                    $oldDepartmentId = $employe->departement_id;
                    $oldDepartment = Departement::find($oldDepartmentId);
                    $lastEmployeDepartement = EmployeDepartement::where('employe_id', $employeId)
                        ->whereNull('date_fin')
                        ->orderBy('date_début', 'desc')
                        ->first();

                    $employe->departement_id = 0;
                    $employe->active = 0;
                    $employe->save();
                    
                    EmployeeHistory::create([
                        'matricule' => $employe->matricule,
                        'nom' => $employe->nom,
                        'prenom' => $employe->prenom,
                        'departement_id' => $oldDepartmentId,
                        'departement_nom' => $oldDepartment ? $oldDepartment->nom : null,
                        'employe_id' => $employe->id,
                        'date_début' => $lastEmployeDepartement ? $lastEmployeDepartement->date_début : $employe->created_at->toDateString(),
                        'date_fin' => $date_fin,
                        'action' => 'removed from department'
                    ]);

                    // Update the employe_departement table
                    DB::table('employe_departement')
                        ->where('employe_id', $employeId)
                        ->whereNull('date_fin')
                        ->update(['date_fin' => $date_fin]);
                }
            }

            DB::commit();

            return response()->json(['message' => 'Employees updated successfully and history recorded'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating employee departments: ' . $e->getMessage());
            return response()->json(['error' => 'An error occurred while updating employees'], 500);
        }
    }


    public function destroy(Employe $employe)
    {
        if (Gate::allows('delete_employes')) {
        try {
            $employe->delete();
            return response()->json(['message' => ''], 200);
        } catch (\Exception $e) {
            Log::error('', ['error' => $e->getMessage()]);
            return response()->json(['error' => ''], 500);
        }
    } else {
        abort(403, 'Vous n\'avez pas l\'autorisation de supprimer un employé.');
    }
    }



    
    public function import(Request $request)
    {
        \Log::info('Début de l\'importation de fichier.');
        \Log::info('l\'importation de fichier : ', $request->all());
    
        $validated = $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv',
            'fieldMappings' => 'required',
            'departement_id' => 'required|integer',
        ]);
    
        $departementId = $request->input('departement_id');
    
        \Log::info('Validation des données réussie.');
    
        try {
            $fieldMappings = json_decode($request->input('fieldMappings'), true);
    
            if (json_last_error() !== JSON_ERROR_NONE) {
                \Log::error('Erreur de décodage JSON : ' . json_last_error_msg());
                return response()->json(['error' => 'Champ fieldMappings invalide'], 400);
            }
    
            // Nettoyer les lettres de colonnes (ex : "B2" => "B")
            $fieldMappings = array_map(function ($col) {
                return preg_replace('/\d+/', '', strtoupper($col));
            }, $fieldMappings);
    
            \Log::info('fieldMappings décodé avec succès :', $fieldMappings);
    
            // Passer aussi departementId au constructeur
            Excel::import(new EmployesImport($fieldMappings, $departementId), $request->file('file'));
    
            \Log::info('Importation Excel terminée avec succès.');
    
            return response()->json(['message' => 'Import terminé avec succès']);
        } catch (\Exception $e) {
            \Log::error('Erreur lors de l\'importation : ' . $e->getMessage());
            return response()->json(['error' => 'Échec de l\'importation'], 500);
        }
    }
    


    public function getThemesBulletins(Request $request)
    {
        $ids = $request->query('ids');
        if (!$ids) {
            return response()->json([], 200);
        }
    
        $idsArray = explode(',', $ids);
    
        $employes = Employe::with('bulletins.modele.theme')
                    ->whereIn('id', $idsArray)
                    ->get();
    
        $result = $employes->map(function ($employe) {
            return [
                'employe_id' => $employe->id,
                'theme_bulletin' => $employe->bulletins->first()?->modele?->theme?->designation ?? null,
            ];
        });
    
        return response()->json($result);
    }
    
    
    public function getRubriquesEtConstantes($id)
    {
        $employe = Employe::with(['bulletins.modele.rubriques', 'bulletins.modele.constantes'])->findOrFail($id);
    
        $rubriques = collect();
        $constantes = collect();
    
        foreach ($employe->bulletins as $bulletin) {
            if ($bulletin->modele) {
                $rubriques = $rubriques->merge($bulletin->modele->rubriques);
                $constantes = $constantes->merge($bulletin->modele->constantes);
            }
        }
    
        return response()->json([
            'rubriques' => $rubriques->unique('id')->values(),
            'constantes' => $constantes->unique('id')->values(),
        ]);
    }
    
    








        
        
}

