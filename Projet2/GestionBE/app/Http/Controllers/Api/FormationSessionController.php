<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Formation;
use App\Models\FormationSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;

class FormationSessionController extends Controller
{
    /**
     * GET /formations/{formation}/sessions
     * List all sessions for a formation with attendance summary.
     */
    public function index(Formation $formation)
    {
        $hasAttendance = Schema::hasTable('formation_attendance');

        $query = $formation->sessions()
            ->orderBy('date')
            ->orderBy('heure_debut');

        if ($hasAttendance) {
            $query->withCount('attendance')
                ->withCount([
                    'attendance as present_count' => function ($q) {
                        $q->where('statut', 'Présent');
                    },
                ]);
        }

        $sessions = $query->get();

        if (!$hasAttendance) {
            $sessions->each(function ($session) {
                $session->attendance_count = 0;
                $session->present_count    = 0;
            });
        }

        return response()->json($sessions);
    }

    /**
     * POST /formations/{formation}/sessions
     * Create a new session and auto-populate attendance rows.
     */
    public function store(Request $request, Formation $formation)
    {
        $data = $request->validate([
            'date'        => 'required|date',
            'heure_debut' => 'nullable|string|max:10',
            'heure_fin'   => 'nullable|string|max:10',
            'salle'       => 'nullable|string|max:255',
            'statut'      => 'nullable|string|max:50',
        ]);

        $data['formation_id'] = $formation->id;
        $data['statut']       = $data['statut'] ?? 'Planifiée';

        $session = FormationSession::create($data);

        // Auto-create attendance for all registered participants
        $session->createAttendanceForParticipants();

        $session->attendance_count = $session->attendance()->count();
        $session->present_count    = $session->attendance()->where('statut', 'Présent')->count();

        return response()->json($session, 201);
    }

    /**
     * PUT /sessions/{session}
     * Update a session.
     */
    public function update(Request $request, FormationSession $session)
    {
        $data = $request->validate([
            'date'        => 'sometimes|required|date',
            'heure_debut' => 'nullable|string|max:10',
            'heure_fin'   => 'nullable|string|max:10',
            'salle'       => 'nullable|string|max:255',
            'statut'      => 'nullable|string|max:50',
        ]);

        $session->update($data);

        $session->attendance_count = $session->attendance()->count();
        $session->present_count    = $session->attendance()->where('statut', 'Présent')->count();

        return response()->json($session);
    }

    /**
     * DELETE /sessions/{session}
     */
    public function destroy(FormationSession $session)
    {
        $session->delete();
        return response()->json(['message' => 'Séance supprimée']);
    }
}
