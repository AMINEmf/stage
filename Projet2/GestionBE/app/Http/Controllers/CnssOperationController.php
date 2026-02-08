<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCnssOperationRequest;
use App\Http\Requests\UpdateCnssOperationRequest;
use App\Http\Resources\CnssOperationResource;
use App\Models\CnssOperation;
use App\Models\Employe;
use Illuminate\Support\Facades\Gate;

class CnssOperationController extends Controller
{
    public function index($employeId)
    {
        Gate::authorize('view_all_employes');

        $employe = Employe::findOrFail($employeId);

        $operations = CnssOperation::where('employe_id', $employe->id)
            ->withCount('documents')
            ->orderBy('date_operation', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return CnssOperationResource::collection($operations);
    }

    public function store(StoreCnssOperationRequest $request, $employeId)
    {
        Gate::authorize('update_employes');

        $employe = Employe::findOrFail($employeId);
        $userId = $request->user()?->id;

        $operation = CnssOperation::create([
            'employe_id' => $employe->id,
            'type_operation' => $request->input('type_operation'),
            'date_operation' => $request->input('date_operation'),
            'reference' => $request->input('reference'),
            'montant' => $request->input('montant'),
            'statut' => $request->input('statut'),
            'notes' => $request->input('notes'),
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        $operation->loadCount('documents');

        return new CnssOperationResource($operation);
    }

    public function show($operationId)
    {
        Gate::authorize('view_all_employes');

        $operation = CnssOperation::with(['documents' => function ($query) {
            $query->orderBy('created_at', 'desc');
        }])->withCount('documents')->findOrFail($operationId);
        return new CnssOperationResource($operation);
    }

    public function update(UpdateCnssOperationRequest $request, $operationId)
    {
        Gate::authorize('update_employes');

        $operation = CnssOperation::findOrFail($operationId);

        if ($operation->statut !== 'EN_COURS') {
            return response()->json([
                'message' => 'Operation non modifiable.',
            ], 403);
        }

        $operation->update([
            'type_operation' => $request->input('type_operation'),
            'date_operation' => $request->input('date_operation'),
            'reference' => $request->input('reference'),
            'montant' => $request->input('montant'),
            'statut' => $request->input('statut'),
            'notes' => $request->input('notes'),
            'updated_by' => $request->user()?->id,
        ]);

        $operation->loadCount('documents');

        return new CnssOperationResource($operation);
    }

    public function destroy($operationId)
    {
        Gate::authorize('delete_employes');

        $operation = CnssOperation::findOrFail($operationId);

        if ($operation->statut !== 'EN_COURS') {
            return response()->json([
                'message' => 'Operation non supprimable.',
            ], 403);
        }

        $operation->delete();

        return response()->json([
            'message' => 'Operation CNSS supprimée avec succès',
        ], 200);
    }
}
