import React, { useState, useCallback } from "react";
import { ChevronDown, ChevronRight, UserPlus, Loader } from "lucide-react";
import Swal from "sweetalert2";
import apiClient from "../../../../../services/apiClient";
import { useSuggestedParticipants } from "../useSuggestedParticipants";

/**
 * Collapsible AI-suggestion panel shown inside the Formation detail drawer.
 *
 * Props:
 *  formation        – the selected formation object (needs .id, .domaine)
 *  onParticipantAdded – callback(formationId) → parent refreshes participants_count
 */
const SuggestedParticipantsPanel = ({ formation, onParticipantAdded }) => {
  const [open, setOpen] = useState(false);
  const [addingId, setAddingId] = useState(null);

  const { suggestions, loading, error, fetchSuggestions, removeFromSuggestions } =
    useSuggestedParticipants(formation?.id);

  const handleToggle = useCallback(() => {
    const next = !open;
    setOpen(next);
    if (next && suggestions.length === 0 && !loading) {
      fetchSuggestions();
    }
  }, [open, suggestions.length, loading, fetchSuggestions]);

  const handleAdd = useCallback(
    async (suggestion) => {
      if (!formation?.id) return;
      setAddingId(suggestion.id);
      try {
        await apiClient.post(`/formations/${formation.id}/participants`, {
          employe_id: suggestion.id,
          statut: "En attente",
        });
        removeFromSuggestions(suggestion.id);
        onParticipantAdded?.(formation.id);
      } catch (err) {
        const msg =
          err.response?.data?.message || "Erreur lors de l'ajout du participant.";
        Swal.fire({ icon: "error", title: "Erreur", text: msg, timer: 2500, showConfirmButton: false });
      } finally {
        setAddingId(null);
      }
    },
    [formation?.id, removeFromSuggestions, onParticipantAdded]
  );

  const TrainingCountBadge = ({ count }) => {
    const color =
      count === 0
        ? { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" }
        : count <= 2
        ? { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" }
        : { bg: "#fef9c3", text: "#854d0e", border: "#fde68a" };
    return (
      <span
        style={{
          backgroundColor: color.bg,
          color: color.text,
          border: `1px solid ${color.border}`,
          borderRadius: "12px",
          padding: "2px 8px",
          fontSize: "0.72rem",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        {count} formation{count !== 1 ? "s" : ""}
      </span>
    );
  };

  return (
    <div style={{ marginTop: "24px", borderTop: "1px solid #e5e7eb", paddingTop: "16px" }}>
      {/* ── Section header (collapsible) ── */}
      <button
        type="button"
        onClick={handleToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "none",
          border: "none",
          padding: "6px 0",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div
          className="cnss-section-title"
          style={{ margin: 0, pointerEvents: "none", userSelect: "none" }}
        >
          <span style={{ fontSize: "1rem" }}>🤖</span>
          <span>Suggestion des participants</span>
        </div>
        {open ? (
          <ChevronDown size={16} color="#6b7280" />
        ) : (
          <ChevronRight size={16} color="#6b7280" />
        )}
      </button>

      {/* ── Collapsible body ── */}
      {open && (
        <div style={{ marginTop: "12px" }}>
          {/* Context pill */}
          {formation?.domaine && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                backgroundColor: "#f0f9ff",
                border: "1px solid #bfdbfe",
                borderRadius: "20px",
                padding: "4px 12px",
                marginBottom: "12px",
                fontSize: "0.8rem",
                color: "#1e40af",
              }}
            >
              <span style={{ fontWeight: 600 }}>Domaine :</span>
              <span>{formation.domaine}</span>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#6b7280",
                fontSize: "0.85rem",
                padding: "12px 0",
              }}
            >
              <Loader size={14} className="spin" />
              Analyse en cours…
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <p style={{ color: "#dc2626", fontSize: "0.85rem" }}>{error}</p>
          )}

          {/* Empty state */}
          {!loading && !error && suggestions.length === 0 && (
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.85rem",
                fontStyle: "italic",
                padding: "8px 0",
              }}
            >
              Aucune suggestion disponible pour ce domaine.
            </p>
          )}

          {/* Suggestions list */}
          {!loading && suggestions.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backgroundColor: s.domain_match ? "#f0fdf4" : "#f9fafb",
                    border: `1px solid ${s.domain_match ? "#bbf7d0" : "#e5e7eb"}`,
                    borderRadius: "8px",
                    padding: "8px 12px",
                    gap: "8px",
                  }}
                >
                  {/* Employee info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.88rem",
                        fontWeight: 600,
                        color: "#111827",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {s.nom_complet || `Employé #${s.id}`}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#6b7280",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {s.matricule && (
                        <span style={{ marginRight: "6px" }}>{s.matricule}</span>
                      )}
                      {s.departement}
                    </div>
                  </div>

                  {/* Badge + button */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexShrink: 0,
                    }}
                  >
                    <TrainingCountBadge count={s.formations_count} />
                    <button
                      type="button"
                      disabled={addingId === s.id}
                      onClick={() => handleAdd(s)}
                      title="Ajouter comme participant"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        backgroundColor: addingId === s.id ? "#9ca3af" : "#3a8a90",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "5px 10px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        cursor: addingId === s.id ? "not-allowed" : "pointer",
                        transition: "background-color 0.2s",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        if (addingId !== s.id)
                          e.currentTarget.style.backgroundColor = "#2c767c";
                      }}
                      onMouseLeave={(e) => {
                        if (addingId !== s.id)
                          e.currentTarget.style.backgroundColor = "#3a8a90";
                      }}
                    >
                      {addingId === s.id ? (
                        <Loader size={12} />
                      ) : (
                        <UserPlus size={12} />
                      )}
                      + Ajouter
                    </button>
                  </div>
                </div>
              ))}

              {/* Refresh link */}
              <button
                type="button"
                onClick={fetchSuggestions}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3a8a90",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  padding: "4px 0",
                  textAlign: "left",
                  textDecoration: "underline",
                }}
              >
                ↻ Actualiser les suggestions
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SuggestedParticipantsPanel;
