import React, { useEffect, useState } from "react";
import { Calendar, Plus, Edit2, Trash2, ClipboardList } from "lucide-react";
import Swal from "sweetalert2";
import SectionTitle from "../../../../CNSS/SectionTitle";
import { useFormationSessions } from "../useFormationSessions";

const STATUT_SESSION_OPTIONS = ["Planifiée", "Terminée", "Annulée"];

const EMPTY_SESSION_FORM = {
  date: "",
  heure_debut: "",
  heure_fin: "",
  salle: "",
  statut: "Planifiée",
};

const statutClass = (statut) => {
  if (statut === "Terminée") return "success";
  if (statut === "Annulée") return "danger";
  return "info";
};

const formatDate = (d) => {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("fr-FR");
  } catch {
    return d;
  }
};

/**
 * SessionsSection
 *
 * Displays the planning (sessions) for a formation inside the view drawer.
 *
 * Props:
 *  - formation {Object}
 *  - onManageAttendance(session) – called when user clicks "Gérer présence"
 */
const SessionsSection = ({ formation, onManageAttendance }) => {
  const {
    sessions,
    loading,
    error,
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
  } = useFormationSessions(formation?.id, {
    sessionsCount: formation?.sessions_count,
    initialSessions: formation?.sessions,
  });

  const [formMode, setFormMode]   = useState(null); // null | "add" | "edit"
  const [editingSession, setEditingSession] = useState(null);
  const [form, setForm]           = useState(EMPTY_SESSION_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (formation?.id) fetchSessions({ silent: true });
  }, [formation?.id, fetchSessions]);

  const openAdd = () => {
    setForm(EMPTY_SESSION_FORM);
    setEditingSession(null);
    setFormMode("add");
  };

  const openEdit = (session) => {
    setForm({
      date:        session.date ? session.date.substring(0, 10) : "",
      heure_debut: session.heure_debut ?? "",
      heure_fin:   session.heure_fin   ?? "",
      salle:       session.salle        ?? "",
      statut:      session.statut       ?? "Planifiée",
    });
    setEditingSession(session);
    setFormMode("edit");
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingSession(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date) return;
    setSubmitting(true);
    try {
      if (formMode === "add") {
        await createSession(form);
        Swal.fire({ icon: "success", title: "Séance ajoutée", timer: 1200, showConfirmButton: false });
      } else {
        await updateSession(editingSession.id, form);
        Swal.fire({ icon: "success", title: "Séance modifiée", timer: 1200, showConfirmButton: false });
      }
      closeForm();
    } catch (err) {
      const msg = err.response?.data?.message || "Erreur lors de la sauvegarde.";
      Swal.fire({ icon: "error", title: "Erreur", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (session) => {
    const result = await Swal.fire({
      title: "Supprimer cette séance ?",
      text: `Séance du ${formatDate(session.date)} sera supprimée.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteSession(session.id);
      Swal.fire({ icon: "success", title: "Séance supprimée", timer: 1200, showConfirmButton: false });
    } catch {
      Swal.fire({ icon: "error", title: "Erreur", text: "Impossible de supprimer la séance." });
    }
  };

  return (
    <div style={{ marginTop: "28px" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <SectionTitle iconComponent={Calendar} text="Planning" />
        {formMode === null && (
          <button
            type="button"
            onClick={openAdd}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "5px 14px",
              backgroundColor: "#3a8a90",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={14} /> Ajouter séance
          </button>
        )}
      </div>

      {/* Inline add/edit form */}
      {formMode !== null && (
        <form onSubmit={handleSubmit} style={{ backgroundColor: "#f8fafc", padding: "14px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "14px" }}>
          <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#2c767c", marginBottom: "10px" }}>
            {formMode === "add" ? "Nouvelle séance" : "Modifier la séance"}
          </p>
          <div className="row g-2">
            <div className="col-md-6">
              <label className="info-label">Date *</label>
              <input
                type="date"
                className="form-control form-control-sm"
                name="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="info-label">Heure début</label>
              <input
                type="time"
                className="form-control form-control-sm"
                name="heure_debut"
                value={form.heure_debut}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-3">
              <label className="info-label">Heure fin</label>
              <input
                type="time"
                className="form-control form-control-sm"
                name="heure_fin"
                value={form.heure_fin}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <label className="info-label">Salle</label>
              <input
                type="text"
                className="form-control form-control-sm"
                name="salle"
                value={form.salle}
                onChange={handleChange}
                placeholder="Ex: Salle A"
              />
            </div>
            <div className="col-md-6">
              <label className="info-label">Statut</label>
              <select
                className="form-select form-select-sm"
                name="statut"
                value={form.statut}
                onChange={handleChange}
              >
                {STATUT_SESSION_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "12px", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={closeForm}
              style={{ padding: "5px 14px", backgroundColor: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "0.82rem", cursor: "pointer" }}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ padding: "5px 14px", backgroundColor: "#3a8a90", color: "#fff", border: "none", borderRadius: "6px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
            >
              {submitting ? "En cours..." : formMode === "add" ? "Ajouter" : "Enregistrer"}
            </button>
          </div>
        </form>
      )}

      {/* Sessions table */}
      {loading && sessions.length === 0 ? (
        <p style={{ fontSize: "0.85rem", color: "#9ca3af" }}>Chargement des séances…</p>
      ) : error && sessions.length === 0 ? (
        <p style={{ fontSize: "0.85rem", color: "#ef4444" }}>{error}</p>
      ) : sessions.length === 0 ? (
        <p style={{ fontSize: "0.85rem", color: "#9ca3af", textAlign: "center", padding: "16px" }}>
          Aucune séance planifiée.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          {loading && (
            <p style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "8px" }}>
              Actualisation du planning...
            </p>
          )}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ backgroundColor: "#f1f5f9", borderBottom: "2px solid #e2e8f0" }}>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Heure</th>
                <th style={thStyle}>Salle</th>
                <th style={thStyle}>Statut</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={tdStyle}>{formatDate(session.date)}</td>
                  <td style={tdStyle}>
                    {session.heure_debut
                      ? `${session.heure_debut}${session.heure_fin ? ` – ${session.heure_fin}` : ""}`
                      : "—"}
                  </td>
                  <td style={tdStyle}>{session.salle || "—"}</td>
                  <td style={tdStyle}>
                    <span className={`career-badge ${statutClass(session.statut)}`}>
                      {session.statut}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        title="Gérer présence"
                        onClick={() => onManageAttendance?.(session)}
                        style={actionBtn("#3a8a90")}
                      >
                        <ClipboardList size={13} />
                      </button>
                      <button
                        type="button"
                        title="Modifier"
                        onClick={() => openEdit(session)}
                        style={actionBtn("#6b7280")}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        title="Supprimer"
                        onClick={() => handleDelete(session)}
                        style={actionBtn("#ef4444")}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const thStyle = {
  padding: "8px 10px",
  textAlign: "left",
  fontWeight: 700,
  color: "#374151",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "8px 10px",
  color: "#374151",
  verticalAlign: "middle",
};

const actionBtn = (color) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "26px",
  height: "26px",
  backgroundColor: color,
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  padding: 0,
});

export default SessionsSection;
