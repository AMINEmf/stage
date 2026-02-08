<?php

namespace App\Http\Controllers;

use App\Http\Resources\CnssDossierDetailResource;
use App\Http\Resources\CnssDossierListResource;
use App\Http\Resources\CnssOperationResource;
use App\Models\CnssAffiliation;
use App\Models\CnssDocument;
use App\Models\CnssOperation;
use App\Models\Employe;
use App\Models\Departement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class CnssDossierController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('view_all_employes');

        $search = trim((string) $request->query('q', ''));
        $departementId = $request->query('departement_id');
        $departementIds = $this->parseDepartementIds($request->query('departement_ids'));
        $status = trim((string) $request->query('cnss_status', ''));
        $perPage = (int) $request->query('per_page', 15);
        $perPage = max(1, min($perPage, 100));

        $activeAffiliationExists = DB::table('cnss_affiliations')
            ->selectRaw('1')
            ->whereColumn('cnss_affiliations.employe_id', 'employes.id')
            ->whereIn('statut', ['Actif', 'ACTIF'])
            ->limit(1);

        $anyAffiliationExists = DB::table('cnss_affiliations')
            ->selectRaw('1')
            ->whereColumn('cnss_affiliations.employe_id', 'employes.id')
            ->limit(1);

        $lastDeclarationBase = DB::table('details_declaration_cnss as d')
            ->join('declarations_cnss as dc', 'dc.id', '=', 'd.declaration_cnss_id')
            ->whereColumn('d.employe_id', 'employes.id')
            ->orderBy('dc.annee', 'desc')
            ->orderBy('dc.mois', 'desc')
            ->orderBy('dc.id', 'desc');

        $numeroAdherentBase = DB::table('cnss_affiliations')
            ->whereColumn('cnss_affiliations.employe_id', 'employes.id')
            ->orderBy('date_debut', 'desc')
            ->orderBy('id', 'desc');

        $operationsCountBase = DB::table('cnss_operations')
            ->whereColumn('cnss_operations.employe_id', 'employes.id');

        $query = DB::table('employes')
            ->leftJoin('departements', 'departements.id', '=', 'employes.departement_id')
            ->select([
                'employes.id',
                'employes.matricule',
                'employes.nom',
                'employes.prenom',
                'employes.departement_id',
                'departements.nom as departement_label',
            ])
            ->selectSub((clone $lastDeclarationBase)->select('dc.mois')->limit(1), 'last_declaration_mois')
            ->selectSub((clone $lastDeclarationBase)->select('dc.annee')->limit(1), 'last_declaration_annee')
            ->selectSub((clone $lastDeclarationBase)->select('dc.statut')->limit(1), 'last_declaration_statut')
            ->selectSub((clone $numeroAdherentBase)->select('numero_cnss')->limit(1), 'numero_adherent')
            ->selectSub((clone $operationsCountBase)->selectRaw('count(*)'), 'operations_count')
            ->selectRaw(
                "CASE
                    WHEN EXISTS (" . $activeAffiliationExists->toSql() . ") THEN 'Actif'
                    WHEN EXISTS (" . $anyAffiliationExists->toSql() . ") THEN 'Inactif'
                    ELSE 'Aucun'
                 END as cnss_affiliation_status",
                array_merge($activeAffiliationExists->getBindings(), $anyAffiliationExists->getBindings())
            );

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('employes.nom', 'like', "%{$search}%")
                    ->orWhere('employes.prenom', 'like', "%{$search}%")
                    ->orWhere('employes.matricule', 'like', "%{$search}%");
            });
        }

        if (empty($departementId) && empty($departementIds)) {
            $emptyPaginator = $query->whereRaw('1 = 0')->paginate($perPage);
            return CnssDossierListResource::collection($emptyPaginator);
        }

        if (!empty($departementIds)) {
            $query->whereIn('employes.departement_id', $departementIds);
        } elseif (!empty($departementId)) {
            $query->where('employes.departement_id', $departementId);
        }

        if ($status !== '') {
            $normalized = strtolower($status);
            if ($normalized === 'actif') {
                $query->whereExists($activeAffiliationExists);
            } elseif ($normalized === 'inactif') {
                $query->whereNotExists($activeAffiliationExists)->whereExists($anyAffiliationExists);
            } elseif ($normalized === 'aucun') {
                $query->whereNotExists($anyAffiliationExists);
            }
        }

        $paginator = $query->paginate($perPage);

        return CnssDossierListResource::collection($paginator);
    }

    public function show($employeId)
    {
        Gate::authorize('view_all_employes');

        $employe = Employe::findOrFail($employeId);
        $departement = null;
        if ($employe->departement_id) {
            $departement = Departement::find($employe->departement_id);
        }

        $affiliation = CnssAffiliation::where('employe_id', $employe->id)
            ->orderBy('date_debut', 'desc')
            ->orderBy('id', 'desc')
            ->first();

        $declarations = DB::table('details_declaration_cnss as d')
            ->join('declarations_cnss as dc', 'dc.id', '=', 'd.declaration_cnss_id')
            ->where('d.employe_id', $employe->id)
            ->orderBy('dc.annee', 'desc')
            ->orderBy('dc.mois', 'desc')
            ->orderBy('dc.id', 'desc')
            ->select([
                'dc.id',
                'dc.mois',
                'dc.annee',
                'dc.statut',
                'dc.montant_total',
            ])
            ->get();

        $operations = CnssOperation::where('employe_id', $employe->id)
            ->withCount('documents')
            ->orderBy('date_operation', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        $documents = $operations->isEmpty()
            ? collect()
            : CnssDocument::whereIn('operation_id', $operations->pluck('id'))
                ->orderBy('created_at', 'desc')
                ->get();

        $employeePayload = [
            'id' => (int) $employe->id,
            'matricule' => $employe->matricule,
            'nom' => $employe->nom,
            'prenom' => $employe->prenom,
            'salaire' => $this->resolveEmployeeSalary($employe),
            'departement_id' => $employe->departement_id,
        ];

        $departementPayload = $departement
            ? ['id' => $departement->id, 'label' => $departement->nom]
            : ['id' => null, 'label' => null];

        $affiliationPayload = $affiliation ? [
            'id' => $affiliation->id,
            'numero_cnss' => $affiliation->numero_cnss,
            'statut' => $affiliation->statut,
            'date_debut' => optional($affiliation->date_debut)->toDateString(),
            'date_fin' => optional($affiliation->date_fin)->toDateString(),
            'salaire' => $affiliation->salaire,
        ] : null;

        $payload = [
            'employe' => $employeePayload,
            'departement' => $departementPayload,
            'affiliation_cnss' => $affiliationPayload,
            'declarations' => $declarations,
            'documents' => $documents,
            'operations' => CnssOperationResource::collection($operations),
        ];

        return new CnssDossierDetailResource($payload);
    }

    private function resolveEmployeeSalary(Employe $employee): float
    {
        $salary = $employee->salaire_base
            ?? $employee->salaire_moyen
            ?? $employee->salaire_reference_annuel
            ?? 0;

        return round((float) $salary, 2);
    }

    private function parseDepartementIds($value): array
    {
        if (empty($value)) {
            return [];
        }

        $ids = [];

        if (is_array($value)) {
            $ids = $value;
        } else {
            $ids = explode(',', (string) $value);
        }

        return collect($ids)
            ->map(fn ($id) => (int) trim((string) $id))
            ->filter(fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();
    }
}
