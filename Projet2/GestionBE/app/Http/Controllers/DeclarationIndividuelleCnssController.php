<?php

namespace App\Http\Controllers;

use App\Models\DeclarationIndividuelleCnss;
use App\Models\Employe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DeclarationIndividuelleCnssController extends Controller
{
    // ─── GET /api/cnss/declarations-individuelles?employe_id=X ──────────────────
    public function index(Request $request)
    {
        try {
            $query = DeclarationIndividuelleCnss::with('employe')
                ->orderBy('annee', 'desc')
                ->orderBy('mois', 'desc');

            if ($request->filled('employe_id')) {
                $query->where('employe_id', $request->employe_id);
            }

            $rows = $query->get()->map(fn ($d) => $this->format($d));

            return response()->json($rows, 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur serveur', 'error' => $e->getMessage()], 500);
        }
    }

    // ─── GET /api/employes/{id}/declarations-individuelles ───────────────────────
    public function byEmploye(int $employeId)
    {
        try {
            $employe = Employe::findOrFail($employeId);

            $rows = DeclarationIndividuelleCnss::where('employe_id', $employeId)
                ->orderBy('annee', 'desc')
                ->orderBy('mois', 'desc')
                ->get()
                ->map(fn ($d) => $this->format($d, $employe));

            return response()->json($rows, 200);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur serveur', 'error' => $e->getMessage()], 500);
        }
    }

    // ─── POST /api/cnss/declarations-individuelles ──────────────────────────────
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'employe_id'            => 'required|integer|exists:employes,id',
            'mois'                  => 'required|integer|min:1|max:12',
            'annee'                 => 'required|integer|min:2000|max:2100',
            'jours_travailles'      => 'required|integer|min:0|max:31',
            'salaire_brut_imposable'=> 'required|numeric|min:0',
            'statut'                => 'sometimes|in:non_declare,declare,valide,paye',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation échouée', 'errors' => $validator->errors()], 422);
        }

        // Check unicité
        $exists = DeclarationIndividuelleCnss::where('employe_id', $request->employe_id)
            ->where('mois', $request->mois)
            ->where('annee', $request->annee)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Une déclaration existe déjà pour cet employé, ce mois et cette année.',
            ], 409);
        }

        $calc = DeclarationIndividuelleCnss::calculerCotisations((float) $request->salaire_brut_imposable);

        $declaration = DeclarationIndividuelleCnss::create([
            'employe_id'            => $request->employe_id,
            'mois'                  => $request->mois,
            'annee'                 => $request->annee,
            'jours_travailles'      => $request->jours_travailles,
            'salaire_brut_imposable'=> $request->salaire_brut_imposable,
            'base_plafonnee'        => $calc['base_plafonnee'],
            'cotisation_salarie'    => $calc['cotisation_salarie'],
            'cotisation_patronale'  => $calc['cotisation_patronale'],
            'statut'                => $request->statut ?? 'non_declare',
        ]);

        $declaration->load('employe');
        return response()->json($this->format($declaration), 201);
    }

    // ─── PUT /api/cnss/declarations-individuelles/{id} ──────────────────────────
    public function update(Request $request, int $id)
    {
        $declaration = DeclarationIndividuelleCnss::find($id);
        if (!$declaration) {
            return response()->json(['message' => 'Déclaration introuvable.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'mois'                  => 'sometimes|integer|min:1|max:12',
            'annee'                 => 'sometimes|integer|min:2000|max:2100',
            'jours_travailles'      => 'sometimes|integer|min:0|max:31',
            'salaire_brut_imposable'=> 'sometimes|numeric|min:0',
            'statut'                => 'sometimes|in:non_declare,declare,valide,paye',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validation échouée', 'errors' => $validator->errors()], 422);
        }

        // Check unicité si mois/annee changent
        $mois = $request->mois ?? $declaration->mois;
        $annee = $request->annee ?? $declaration->annee;

        $conflict = DeclarationIndividuelleCnss::where('employe_id', $declaration->employe_id)
            ->where('mois', $mois)
            ->where('annee', $annee)
            ->where('id', '!=', $id)
            ->exists();

        if ($conflict) {
            return response()->json([
                'message' => 'Une déclaration existe déjà pour cet employé, ce mois et cette année.',
            ], 409);
        }

        $salaire = (float) ($request->salaire_brut_imposable ?? $declaration->salaire_brut_imposable);
        $calc    = DeclarationIndividuelleCnss::calculerCotisations($salaire);

        $declaration->update(array_merge(
            $request->only(['mois', 'annee', 'jours_travailles', 'salaire_brut_imposable', 'statut']),
            [
                'salaire_brut_imposable'=> $salaire,
                'base_plafonnee'        => $calc['base_plafonnee'],
                'cotisation_salarie'    => $calc['cotisation_salarie'],
                'cotisation_patronale'  => $calc['cotisation_patronale'],
            ]
        ));

        $declaration->load('employe');
        return response()->json($this->format($declaration), 200);
    }

    // ─── DELETE /api/cnss/declarations-individuelles/{id} ───────────────────────
    public function destroy(int $id)
    {
        $declaration = DeclarationIndividuelleCnss::find($id);
        if (!$declaration) {
            return response()->json(['message' => 'Déclaration introuvable.'], 404);
        }
        $declaration->delete();
        return response()->json(['message' => 'Déclaration supprimée.'], 200);
    }

    // ─── Formatter ──────────────────────────────────────────────────────────────
    private function format(DeclarationIndividuelleCnss $d, ?Employe $emp = null): array
    {
        $employe = $emp ?? $d->employe;
        return [
            'id'                    => $d->id,
            'employe_id'            => $d->employe_id,
            'matricule'             => $employe?->matricule ?? '-',
            'nom'                   => $employe?->nom ?? '-',
            'prenom'                => $employe?->prenom ?? '-',
            'cin'                   => $employe?->cin ?? '-',
            'salaire_base'          => (float) ($employe?->salaire_base ?? 0),
            'mois'                  => $d->mois,
            'annee'                 => $d->annee,
            'jours_travailles'      => $d->jours_travailles,
            'salaire_brut_imposable'=> $d->salaire_brut_imposable,
            'base_plafonnee'        => $d->base_plafonnee,
            'cotisation_salarie'    => $d->cotisation_salarie,
            'cotisation_patronale'  => $d->cotisation_patronale,
            'statut'                => $d->statut,
            'created_at'            => $d->created_at?->toDateTimeString(),
            'updated_at'            => $d->updated_at?->toDateTimeString(),
        ];
    }
}
