<?php

namespace App\Http\Controllers;

use App\Models\CimrAffiliation;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CimrAffiliationController extends Controller
{
    public function index()
    {
        return CimrAffiliation::orderByDesc('created_at')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employe' => ['required', 'string', 'max:255'],
            'matricule' => ['required', 'string', 'max:255'],
            'cin' => ['nullable', 'string', 'max:255'],
            'poste' => ['nullable', 'string', 'max:255'],
            'date_embauche' => ['nullable', 'date'],
            'departement_id' => ['nullable'],
            'numero_cimr' => ['nullable', 'string', 'max:255'],
            'date_affiliation' => ['nullable', 'date'],
            'date_fin_affiliation' => ['nullable', 'date'],
            'salaire_cotisable' => ['nullable', 'numeric'],
            'taux_employeur' => ['nullable', 'numeric'],
            'montant_cotisation' => ['nullable', 'numeric'],
            'statut' => ['required', Rule::in(['actif', 'suspendu'])],
            'fiche_affiliation' => ['nullable'],
            'fiche_affiliation.*' => ['nullable', 'file', 'max:20480'],
        ]);

        // Handle multiple file uploads
        $uploadedFiles = [];
        if ($request->hasFile('fiche_affiliation')) {
            try {
                $files = $request->file('fiche_affiliation');
                // Handle both single file and array of files
                if (!is_array($files)) {
                    $files = [$files];
                }
                foreach ($files as $file) {
                    if ($file && $file->isValid()) {
                        $filename = time() . '_' . uniqid() . '_' . preg_replace('/[^A-Za-z0-9\.\-\_]/', '', $file->getClientOriginalName());
                        $path = $file->storeAs('cimr_affiliations', $filename, 'public');
                        $uploadedFiles[] = $path;
                    }
                }
            } catch (\Exception $e) {
                return response()->json(['message' => 'Erreur upload fichier: ' . $e->getMessage()], 422);
            }
        }
        
        if (!empty($uploadedFiles)) {
            $validated['fiche_affiliation'] = json_encode($uploadedFiles);
        } else {
            unset($validated['fiche_affiliation']);
        }

        $affiliation = CimrAffiliation::create($validated);

        return response()->json($affiliation, 201);
    }

    public function show(CimrAffiliation $cimrAffiliation)
    {
        return $cimrAffiliation;
    }

    public function update(Request $request, CimrAffiliation $cimrAffiliation)
    {
        $validated = $request->validate([
            'employe' => ['sometimes', 'required', 'string', 'max:255'],
            'matricule' => ['sometimes', 'required', 'string', 'max:255'],
            'cin' => ['sometimes', 'nullable', 'string', 'max:255'],
            'poste' => ['sometimes', 'nullable', 'string', 'max:255'],
            'date_embauche' => ['sometimes', 'nullable', 'date'],
            'departement_id' => ['sometimes', 'nullable'],
            'numero_cimr' => ['sometimes', 'nullable', 'string', 'max:255'],
            'date_affiliation' => ['sometimes', 'nullable', 'date'],
            'date_fin_affiliation' => ['sometimes', 'nullable', 'date'],
            'salaire_cotisable' => ['sometimes', 'nullable', 'numeric'],
            'taux_employeur' => ['sometimes', 'nullable', 'numeric'],
            'montant_cotisation' => ['sometimes', 'nullable', 'numeric'],
            'statut' => ['sometimes', 'required', Rule::in(['actif', 'suspendu'])],
            'fiche_affiliation' => ['nullable'],
            'fiche_affiliation.*' => ['nullable', 'file', 'max:20480'],
        ]);

        // Gérer les fichiers existants à conserver et à supprimer
        $filesToKeep = [];
        $filesToDelete = [];
        
        if ($request->has('files_to_keep')) {
            $filesToKeep = json_decode($request->input('files_to_keep'), true) ?: [];
        }
        
        if ($request->has('files_to_delete')) {
            $filesToDelete = json_decode($request->input('files_to_delete'), true) ?: [];
            // Supprimer les fichiers marqués pour suppression
            foreach ($filesToDelete as $fileToDelete) {
                \Storage::disk('public')->delete($fileToDelete);
            }
        }

        // Traiter les nouveaux fichiers uploadés
        $uploadedFiles = [];
        if ($request->hasFile('fiche_affiliation')) {
            try {
                $files = $request->file('fiche_affiliation');
                if (!is_array($files)) {
                    $files = [$files];
                }
                foreach ($files as $file) {
                    if ($file && $file->isValid()) {
                        $filename = time() . '_' . uniqid() . '_' . preg_replace('/[^A-Za-z0-9\.\-\_]/', '', $file->getClientOriginalName());
                        $path = $file->storeAs('cimr_affiliations', $filename, 'public');
                        $uploadedFiles[] = $path;
                    }
                }
            } catch (\Exception $e) {
                return response()->json(['message' => 'Erreur upload fichier: ' . $e->getMessage()], 422);
            }
        }
        
        // Fusionner fichiers à conserver et nouveaux fichiers
        $allFiles = array_merge($filesToKeep, $uploadedFiles);
        
        if (!empty($allFiles)) {
            $validated['fiche_affiliation'] = json_encode($allFiles);
        } else {
            $validated['fiche_affiliation'] = null;
        }

        $cimrAffiliation->update($validated);

        return response()->json($cimrAffiliation);
    }

    public function destroy(CimrAffiliation $cimrAffiliation)
    {
        $cimrAffiliation->delete();

        return response()->noContent();
    }
}
