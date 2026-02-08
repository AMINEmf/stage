<?php

namespace App\Http\Controllers;

use App\Models\CnssAffiliation;
use App\Models\CnssDeclaration;
use App\Models\CnssDeclarationDetail;
use App\Models\Employe;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class CnssDeclarationController extends Controller
{
    private const ACTIVE_AFFILIATION_STATUSES = ['Actif', 'ACTIF'];

    public function index()
    {
        try {
            $rate = $this->cnssRate();

            $declarations = CnssDeclaration::withCount('details')
                ->orderBy('annee', 'desc')
                ->orderBy('mois', 'desc')
                ->orderBy('id', 'desc')
                ->get()
                ->map(function (CnssDeclaration $declaration) use ($rate) {
                    $montantTotal = (float) $declaration->montant_total;
                    $masseSalariale = $rate > 0 ? $montantTotal / $rate : 0;

                    return [
                        'id' => $declaration->id,
                        'mois' => (int) $declaration->mois,
                        'annee' => (int) $declaration->annee,
                        'statut' => $declaration->statut,
                        'nombre_employes' => (int) ($declaration->details_count ?? 0),
                        'masse_salariale' => round($masseSalariale, 2),
                        'montant_total' => round($montantTotal, 2),
                        'cnss_rate' => $rate,
                    ];
                });

            return response()->json($declarations, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des déclarations CNSS',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function eligibleEmployees()
    {
        try {
            $employees = $this->getEligibleEmployeesCollection();
            return response()->json($employees->values(), 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des employés éligibles',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mois' => 'required|integer|min:1|max:12',
            'annee' => 'required|integer|min:2000|max:2100',
            'statut' => 'required|in:EN_ATTENTE,DECLARE,PAYE',
            'employe_ids' => 'required|array|min:1',
            'employe_ids.*' => 'integer|exists:employes,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $mois = (int) $request->mois;
        $annee = (int) $request->annee;
        $selectedEmployeeIds = collect($request->employe_ids)->map(fn ($id) => (int) $id)->unique()->values();

        $existsForPeriod = CnssDeclaration::where('mois', $mois)
            ->where('annee', $annee)
            ->exists();

        if ($existsForPeriod) {
            return response()->json([
                'message' => 'Une déclaration CNSS existe déjà pour ce mois et cette année.',
            ], 409);
        }

        return $this->persistDeclaration(null, $request, $selectedEmployeeIds);
    }

    public function show($id)
    {
        try {
            $declaration = CnssDeclaration::with([
                'details.employe',
                'details.affiliation',
            ])->findOrFail($id);

            $detailRows = $declaration->details->map(function (CnssDeclarationDetail $detail) {
                $employe = $detail->employe;
                $salary = $this->resolveEmployeeSalary($employe);

                return [
                    'id' => $detail->id,
                    'employe_id' => $employe?->id,
                    'matricule' => $employe?->matricule,
                    'nom' => $employe?->nom,
                    'prenom' => $employe?->prenom,
                    'numero_cnss' => $detail->affiliation?->numero_cnss,
                    'salaire' => $salary,
                    'affiliation_cnss_id' => $detail->affiliation_cnss_id,
                ];
            })->values();

            $masseSalariale = round($detailRows->sum(fn ($row) => (float) ($row['salaire'] ?? 0)), 2);

            return response()->json([
                'id' => $declaration->id,
                'mois' => (int) $declaration->mois,
                'annee' => (int) $declaration->annee,
                'statut' => $declaration->statut,
                'nombre_employes' => $detailRows->count(),
                'masse_salariale' => $masseSalariale,
                'montant_total' => round((float) $declaration->montant_total, 2),
                'cnss_rate' => $this->cnssRate(),
                'details' => $detailRows,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Déclaration CNSS introuvable',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'mois' => 'required|integer|min:1|max:12',
            'annee' => 'required|integer|min:2000|max:2100',
            'statut' => 'required|in:EN_ATTENTE,DECLARE,PAYE',
            'employe_ids' => 'required|array|min:1',
            'employe_ids.*' => 'integer|exists:employes,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $declaration = CnssDeclaration::find($id);
        if (!$declaration) {
            return response()->json([
                'message' => 'Déclaration CNSS introuvable',
            ], 404);
        }

        $mois = (int) $request->mois;
        $annee = (int) $request->annee;
        $selectedEmployeeIds = collect($request->employe_ids)->map(fn ($employeeId) => (int) $employeeId)->unique()->values();

        $existsForPeriod = CnssDeclaration::where('mois', $mois)
            ->where('annee', $annee)
            ->where('id', '!=', $declaration->id)
            ->exists();

        if ($existsForPeriod) {
            return response()->json([
                'message' => 'Une déclaration CNSS existe déjà pour ce mois et cette année.',
            ], 409);
        }

        return $this->persistDeclaration($declaration, $request, $selectedEmployeeIds);
    }

    public function destroy($id)
    {
        try {
            $declaration = CnssDeclaration::findOrFail($id);
            $declaration->delete();

            return response()->json([
                'message' => 'Déclaration CNSS supprimée avec succès',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la suppression de la déclaration CNSS',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function persistDeclaration(?CnssDeclaration $declaration, Request $request, Collection $selectedEmployeeIds)
    {
        try {
            $eligibleEmployees = $this->getEligibleEmployeesCollection()->keyBy('id');

            $invalidIds = $selectedEmployeeIds
                ->filter(fn ($employeeId) => !$eligibleEmployees->has($employeeId))
                ->values();

            if ($invalidIds->isNotEmpty()) {
                return response()->json([
                    'message' => 'Les employés sélectionnés doivent avoir une affiliation CNSS active.',
                    'invalid_employe_ids' => $invalidIds,
                ], 422);
            }

            $selectedEmployees = $selectedEmployeeIds
                ->map(fn ($employeeId) => $eligibleEmployees->get($employeeId))
                ->filter();

            $masseSalariale = round($selectedEmployees->sum(fn ($employee) => (float) $employee['salaire']), 2);
            $montantTotal = round($masseSalariale * $this->cnssRate(), 2);

            DB::beginTransaction();

            $declaration = $declaration ?? new CnssDeclaration();
            $declaration->mois = (int) $request->mois;
            $declaration->annee = (int) $request->annee;
            $declaration->statut = $request->statut;
            $declaration->montant_total = $montantTotal;
            $declaration->save();

            if ($declaration->exists) {
                CnssDeclarationDetail::where('declaration_cnss_id', $declaration->id)->delete();
            }

            $detailRows = $selectedEmployees->map(function ($employee) use ($declaration) {
                return [
                    'declaration_cnss_id' => $declaration->id,
                    'employe_id' => (int) $employee['id'],
                    'affiliation_cnss_id' => (int) $employee['affiliation_cnss_id'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            })->values()->all();

            if (!empty($detailRows)) {
                CnssDeclarationDetail::insert($detailRows);
            }

            DB::commit();

            return $this->show($declaration->id);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Erreur lors de l’enregistrement de la déclaration CNSS',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function getEligibleEmployeesCollection(): Collection
    {
        $activeAffiliations = CnssAffiliation::with('employe')
            ->whereIn('statut', self::ACTIVE_AFFILIATION_STATUSES)
            ->get();

        return $activeAffiliations
            ->filter(fn (CnssAffiliation $affiliation) => $affiliation->employe !== null)
            ->map(function (CnssAffiliation $affiliation) {
                /** @var Employe $employe */
                $employe = $affiliation->employe;

                return [
                    'id' => (int) $employe->id,
                    'matricule' => $employe->matricule,
                    'nom' => $employe->nom,
                    'prenom' => $employe->prenom,
                    'salaire' => $this->resolveEmployeeSalary($employe),
                    'affiliation_cnss_id' => (int) $affiliation->id,
                    'numero_cnss' => $affiliation->numero_cnss,
                ];
            })
            ->keyBy('id')
            ->values();
    }

    private function resolveEmployeeSalary(Employe $employee): float
    {
        $salary = $employee->salaire_base
            ?? $employee->salaire_moyen
            ?? $employee->salaire_reference_annuel
            ?? 0;

        return round((float) $salary, 2);
    }

    private function cnssRate(): float
    {
        return (float) config('cnss.declaration_rate', 0.25);
    }
}
