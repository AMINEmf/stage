<?php


namespace App\Http\Controllers;
use App\Models\Employe;
use App\Models\Departement;
use App\Models\EmployeDepartement;
use App\Models\EmployeeHistory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class EmployeDepartementController extends Controller
{
    public function index()
    {
        Gate::authorize('view_all_employee_histories');
        $employeDepartements = EmployeDepartement::with(['employe', 'departement.parent'])->get();

        return response()->json([
            'employeDepartements' => $employeDepartements,
            'message' => 'Employee-Department relationships retrieved successfully'
        ]);
    }


    
    public function store(Request $request)
    {
        Gate::authorize('create_employee_histories');
        Log::info('Incoming request data:', $request->all());

        try {
            DB::beginTransaction();

            $validatedData = $request->validate([
                'employe_id' => 'required|exists:employes,id',
                'departement_id' => 'required|exists:departements,id',
                'date_début' => 'required|date',
            ]);

            $employeDepartement = EmployeDepartement::create([
                'employe_id' => $validatedData['employe_id'],
                'departement_id' => $validatedData['departement_id'],
                'date_début' => $validatedData['date_début'],
            ]);

            $employe = Employe::find($validatedData['employe_id']);
            $oldDepartmentId = $employe->departement_id;
            $employe->departement_id = $validatedData['departement_id'];
            $employe->active = 1;
            $employe->save();

            $newDepartment = Departement::find($validatedData['departement_id']);
            $oldDepartment = Departement::find($oldDepartmentId);

            // Create history record
            EmployeeHistory::create([
                'matricule' => $employe->matricule,
                'nom' => $employe->nom,
                'prenom' => $employe->prenom,
                'departement_id' => $validatedData['departement_id'],
                'departement_nom' => $newDepartment->nom,
                'employe_id' => $validatedData['employe_id'],
                'date_début' => $validatedData['date_début'],
                'date_fin' => null,
                'action' => $oldDepartmentId == 0 ? 'affecté au département' : 'nouvelle entrée'
            ]);

            if ($oldDepartmentId != 0 && $oldDepartmentId != $validatedData['departement_id']) {
                EmployeeHistory::create([
                    'matricule' => $employe->matricule,
                    'nom' => $employe->nom,
                    'prenom' => $employe->prenom,
                    'departement_id' => $oldDepartmentId,
                    'departement_nom' => $oldDepartment ? $oldDepartment->nom : null,
                    'employe_id' => $validatedData['employe_id'],
                    'date_début' => null,
                    'date_fin' => now(),
                    'action' => 'retiré du département'
                ]);
            }

            DB::commit();

            return response()->json([
                'employeDepartement' => $employeDepartement,
                'message' => 'Relationship created successfully and history recorded'
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error in EmployeDepartementController@store: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'An error occurred while creating the employee-department relationship',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    public function getEmployeeHistory()
    {
        Gate::authorize('view_all_employee_histories');
        Log::info("Demande d'historique des employés");
    
        try {
            $employeeHistory = EmployeeHistory::all();
    
            Log::info("Données récupérées: ", $employeeHistory->toArray());
    
            if ($employeeHistory->isEmpty()) {
                Log::warning("Aucun enregistrement d'employés trouvé");
                return response()->json(['message' => "Aucun enregistrement d'employés trouvé"], 404);
            }
    
            $formattedHistory = $employeeHistory->map(function ($history) {
                return [
                    'id' => $history->id,
                    'matricule' => $history->matricule,
                    'nom' => $history->nom,
                    'prenom' => $history->prenom,
                    'departement_id' => $history->departement_id,
                    'departement_nom' => $history->departement_nom,
                    'employe_id' => $history->employe_id,
                    'date_debut' => $history->date_début,
                    'date_fin' => $history->date_fin,
                    'action' => $history->action
                ];
            });
    
            Log::info("Les données ont été formatées avec succès");
            Log::debug("Données formatées: " . json_encode($formattedHistory));
    
            return response()->json($formattedHistory, 200);
        } catch (\Exception $e) {
            Log::error("Erreur dans getEmployeeHistory: " . $e->getMessage());
            Log::error("Trace complète: " . $e->getTraceAsString());
            return response()->json(['message' => "Une erreur s'est produite lors de la récupération de l'historique des employés"], 500);
        }
    }


public function updateOrCreate(Request $request)
{
    Gate::authorize('update_employee_histories');
    Log::info('Incoming request data:', $request->all());

    try {
        DB::beginTransaction();

        $validatedData = $request->validate([
            'employe_id' => 'required|exists:employes,id',
            'departement_id' => 'required|exists:departements,id',
            'date_début' => 'required|date',
        ]);

        $employe = Employe::find($validatedData['employe_id']);
        $oldDepartmentId = $employe->departement_id;
        $oldDepartment = Departement::find($oldDepartmentId);
        $newDepartment = Departement::find($validatedData['departement_id']);

        $employeDepartement = EmployeDepartement::updateOrCreate(
            ['employe_id' => $validatedData['employe_id']],
            [
                'departement_id' => $validatedData['departement_id'],
                'date_début' => $validatedData['date_début'],
                'date_fin' => null
            ]
        );

        $employe->departement_id = $validatedData['departement_id'];
        $employe->active = 1;
        $employe->save();

        EmployeeHistory::create([
            'matricule' => $employe->matricule,
            'nom' => $employe->nom,
            'prenom' => $employe->prenom,
            'departement_id' => $validatedData['departement_id'],
            'departement_nom' => $newDepartment->nom,
            'employe_id' => $validatedData['employe_id'],
            'date_début' => $validatedData['date_début'],
            'date_fin' => null,
            'action' => $oldDepartmentId == 0 ? 'affecté au département' : 'nouvelle entrée'
        ]);

        if ($oldDepartmentId != 0 && $oldDepartmentId != $validatedData['departement_id']) {
            EmployeeHistory::create([
                'matricule' => $employe->matricule,
                'nom' => $employe->nom,
                'prenom' => $employe->prenom,
                'departement_id' => $oldDepartmentId,
                'departement_nom' => $oldDepartment ? $oldDepartment->nom : null,
                'employe_id' => $validatedData['employe_id'],
                'date_début' => null,
                'date_fin' => now(),
                'action' => 'retiré du département'
            ]);
        }

        DB::commit();

        Log::info('EmployeDepartement updated or created:', $employeDepartement->toArray());
        Log::info('Employee data updated:', $employe->toArray());

        return response()->json([
            'employeDepartement' => $employeDepartement,
            'message' => 'Relationship updated or created successfully and history recorded'
        ], 200);
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Error in EmployeDepartementController@updateOrCreate: ' . $e->getMessage());
        Log::error('Stack trace: ' . $e->getTraceAsString());
        return response()->json([
            'message' => 'An error occurred while updating or creating the employee-department relationship',
            'error' => $e->getMessage()
        ], 500);
    }
}

    public function removeEmployeFromDepartement(Request $request, $departementId)
    {
        Gate::authorize('update_employee_histories');
        $validatedData = $request->validate([
            'employe_id' => 'nullable|exists:employes,id'
        ]);

        $removed = EmployeDepartement::where('departement_id', $departementId)
                                     ->where('employe_id', $validatedData['employe_id'])
                                     ->delete();

        if ($removed) {
            return response()->json(['message' => 'Employee removed from department successfully'], 200);
        } else {
            return response()->json(['message' => 'Employee not found in department'], 404);
        }
    }

    public function destroy($id)
    {
        Gate::authorize('delete_employee_histories');
        $employe = Employe::findOrFail($id);
        $employe->departements()->detach();  
        $employe->delete(); 

        return response()->json(['message' => 'Employee and all department relationships deleted successfully'], 200);
    }
}