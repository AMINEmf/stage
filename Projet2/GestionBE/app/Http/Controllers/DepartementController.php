<?php

namespace App\Http\Controllers;

use App\Models\Departement;
use App\Models\Employe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Gate;


class DepartementController extends Controller
{
    public function index()
    {
        if (Gate::allows('view_all_departements')) {
            return Departement::with(['employes', 'children', 'parent'])->get();
        }
        return response()->json(['message' => 'Accès refusé'], 403);
    }



    public function TotalDepartemet() 
    {
        if (!Gate::allows('view_all_departements')) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }
        $total = Departement::where( 'parent_id', NULL)-> Count();
        return response()->json([
            'totalDepartements' => $total
        ]);
    
    }


    
    public function getHierarchy()
    {
        if (!Gate::allows('view_all_departements')) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }
        \Log::info('getHierarchy called');
        $rootDepartments = Departement::whereNull('parent_id')->with('children')->get();
        return response()->json($this->buildHierarchy($rootDepartments));
    }

    private function buildHierarchy($departments)
    {
        $result = [];
        foreach ($departments as $department) {
            $dept = [
                'id' => $department->id,
                'nom' => $department->nom,
                'children' => $this->buildHierarchy($department->children)
            ];
            $result[] = $dept;
        }
        return $result;
    }



    public function store(Request $request)
    {
        if (!Gate::allows('create_departements')) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }
        Log::info('Debut de store departement');
        Log::info('Données reçues du frontend', $request->all());



        try {

        $request->validate([
            'nom' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:departements,id'
        ]);

        $departement = Departement::create($request->all());
        Log::info('Nouveau departement créé avec succès.', [
            'id' => $departement->id,
            'nom' => $departement->nom,
        ]);

        return response()->json($departement, 201);
    } catch (\Illuminate\Validation\ValidationException $e) {
        Log::warning('Erreur de validation lors de la création d\'un departement.', [
            'errors' => $e->errors()
        ]);
        return response()->json([
            'message' => 'Erreur de validation',
            'errors' => $e->errors()
        ], 422);

    } catch (\Exception $e) {
        Log::error('Erreur serveur lors de la création d\'un departement.', [
            'error' => $e->getMessage()
        ]);
        return response()->json([
            'message' => 'Erreur serveur lors de la création du departement',
            'error' => $e->getMessage()
        ], 500);
    }

    }


    public function update(Request $request, Departement $departement)
    {
        if (!Gate::allows('update_departements')) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }
        $request->validate([
            'nom' => 'nullable|string|max:255',
            'parent_id' => 'nullable|exists:departements,id'
        ]);

        // Prevent a department from being its own parent
        if ($request->parent_id == $departement->id) {
            return response()->json(['error' => 'A department cannot be its own parent'], 422);
        }

        // Prevent circular references
        if ($this->wouldCreateCircularReference($departement, $request->parent_id)) {
            return response()->json(['error' => 'This would create a circular reference'], 422);
        }

        $departement->update($request->all());
        return response()->json($departement, 200);
    }

    public function destroy(Departement $departement)
    {
        if (!Gate::allows('delete_departements')) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }
        try {
            // Start a database transaction
            DB::beginTransaction();

            // Update employees of this department and its sub-departments
            $this->updateEmployeesRecursively($departement);

            // Recursively delete all sub-departments
            $this->deleteSubDepartements($departement);

            // Delete the department itself
            $departement->delete();

            // Commit the transaction
            DB::commit();

            return response()->json(['message' => 'Département supprimé avec succès'], 200);
        } catch (\Exception $e) {
            // If an error occurs, rollback the transaction
            DB::rollBack();
            return response()->json(['error' => 'Unable to delete department: ' . $e->getMessage()], 500);
        }
    }

    private function updateEmployeesRecursively(Departement $departement)
    {
        // Update employees of the current department
        Employe::where('departement_id', $departement->id)
               ->update([
                   'departement_id' => 0,
                   'active' => 0
               ]);

        // Recursively update employees of sub-departments
        foreach ($departement->children as $child) {
            $this->updateEmployeesRecursively($child);
        }
    }

    private function deleteSubDepartements(Departement $departement)
    {
        // Get all direct child departments
        $children = $departement->children;

        foreach ($children as $child) {
            // Recursively delete sub-departments
            $this->deleteSubDepartements($child);

            // Delete the child department
            $child->delete();
        }
    }

   
    private function wouldCreateCircularReference(Departement $departement, $newParentId)
    {
        $current = Departement::find($newParentId);
        while ($current) {
            if ($current->id === $departement->id) {
                return true;
            }
            $current = $current->parent;
        }
        return false;
    }

    public function getServices($departementId)
    {
        if (!Gate::allows('view_all_departements')) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }
        $departement = Departement::findOrFail($departementId);
        $services = $departement->services;
    
        return response()->json($services);
    }
    




    public function show($id)
    {
        if (!Gate::allows('view_all_departements')) {
            return response()->json(['message' => 'Accès refusé'], 403);
        }
        // On récupère le département avec son parent
        $departement = Departement::with('parent')->find($id);

        if (!$departement) {
            return response()->json(['error' => 'Département non trouvé'], 404);
        }

        return response()->json([
            'id' => $departement->id,
            'nom' => $departement->nom,
            'parent_id' => $departement->parent_id,
            'parent_nom' => $departement->parent ? $departement->parent->nom : null,
        ]);
    }






}
