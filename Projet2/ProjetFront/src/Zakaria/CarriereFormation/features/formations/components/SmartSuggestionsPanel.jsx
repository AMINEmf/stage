import React, { useState, useCallback, useEffect } from "react";
import { ChevronDown, ChevronRight, UserPlus, Loader, RefreshCw, Sparkles } from "lucide-react";
import Swal from "sweetalert2";
import apiClient from "../../../../../services/apiClient";
import { useSmartSuggestions } from "../useSmartSuggestions";

// ─── Score badge (Modern Redesign) ──────────────────────────────────────────
const ScoreBadge = ({ score }) => {
  const config =
    score > 75
      ? {
          gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          shadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
          label: "Haute priorité",
          emoji: "⭐",
          borderColor: "#10b981"
        }
      : score >= 50
      ? {
          gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          shadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
          label: "Priorité moyenne",
          emoji: "💡",
          borderColor: "#f59e0b"
        }
      : {
          gradient: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
          shadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
          label: "Faible priorité",
          emoji: "📌",
          borderColor: "#ef4444"
        };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
      {/* Score circle with gradient */}
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: config.gradient,
          boxShadow: config.shadow,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          position: "relative",
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
      >
        <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontSize: "0.6rem", color: "#fff", opacity: 0.9, lineHeight: 1, marginTop: "2px" }}>
          points
        </span>
      </div>
      {/* Priority label with emoji */}
      <span
        style={{
          fontSize: "0.65rem",
          fontWeight: 700,
          color: "#fff",
          background: config.gradient,
          borderRadius: "12px",
          padding: "3px 10px",
          whiteSpace: "nowrap",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}
      >
        {config.emoji} {config.label}
      </span>
    </div>
  );
};

// ─── Reason pills (Enhanced Design) ─────────────────────────────────────────
const ReasonPill = ({ text }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      fontSize: "0.72rem",
      color: "#1f2937",
      background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
      border: "1px solid #86efac",
      borderRadius: "14px",
      padding: "4px 12px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      transition: "all 0.2s ease",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-1px)";
      e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";
    }}
  >
    <span style={{ 
      color: "#059669", 
      fontSize: "0.75rem", 
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
    }}>✓</span>
    <span style={{ fontWeight: 500 }}>{text}</span>
  </span>
);

// ─── Stat item (Card Style) ─────────────────────────────────────────────────
const StatItem = ({ icon, label, value }) => (
  <div style={{ 
    display: "flex", 
    alignItems: "center", 
    gap: "6px", 
    fontSize: "0.75rem",
    backgroundColor: "#f9fafb",
    borderRadius: "10px",
    padding: "6px 12px",
    border: "1px solid #e5e7eb",
    transition: "all 0.2s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = "#f3f4f6";
    e.currentTarget.style.borderColor = "#d1d5db";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = "#f9fafb";
    e.currentTarget.style.borderColor = "#e5e7eb";
  }}
  >
    <span style={{ fontSize: "1rem" }}>{icon}</span>
    <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
      <span style={{ color: "#6b7280", fontSize: "0.65rem", fontWeight: 500 }}>{label}</span>
      <span style={{ fontWeight: 700, color: "#111827", fontSize: "0.8rem" }}>{value}</span>
    </div>
  </div>
);

// ─── Main component ──────────────────────────────────────────────────────────

/**
 * Collapsible Smart Suggestions panel — replaces SuggestedParticipantsPanel.
 *
 * Props:
 *   formation        – the selected formation object (.id, .domaine)
 *   onParticipantAdded – callback(formationId) → parent refreshes participants_count
 */
const SmartSuggestionsPanel = ({ formation, onParticipantAdded }) => {
  const [open, setOpen]       = useState(false);
  const [addingId, setAddingId] = useState(null);

  const { suggestions, loading, error, fetchSuggestions, removeFromSuggestions } =
    useSmartSuggestions(formation?.id);

  // Warm cache when selected formation changes.
  useEffect(() => {
    if (formation?.id) {
      fetchSuggestions({ silent: true });
    }
  }, [formation?.id, fetchSuggestions]);

  // Refresh in background when panel is opened.
  useEffect(() => {
    if (open && formation?.id) {
      fetchSuggestions({ silent: true });
    }
  }, [formation?.id, open, fetchSuggestions]);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

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
        const msg = err.response?.data?.message || "Erreur lors de l'ajout du participant.";
        Swal.fire({ icon: "error", title: "Erreur", text: msg, timer: 2500, showConfirmButton: false });
      } finally {
        setAddingId(null);
      }
    },
    [formation?.id, removeFromSuggestions, onParticipantAdded]
  );

  return (
    <div style={{ 
      marginTop: "28px", 
      background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
      borderRadius: "16px",
      padding: "20px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      border: "1px solid #e2e8f0",
    }}>

      {/* ── Section header (collapsible toggle) ── */}
      <button
        type="button"
        onClick={handleToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          border: "none",
          padding: "14px 18px",
          borderRadius: "12px",
          cursor: "pointer",
          textAlign: "left",
          boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(59, 130, 246, 0.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
        }}
      >
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "12px",
          margin: 0, 
          pointerEvents: "none", 
          userSelect: "none" 
        }}>
          <Sparkles size={22} color="#fff" style={{ 
            filter: "drop-shadow(0 0 8px rgba(255,255,255,0.5))",
          }} />
          <span style={{ 
            fontSize: "1.05rem", 
            fontWeight: 700, 
            color: "#fff",
            letterSpacing: "0.3px",
          }}>
            Suggestion des participants
          </span>
          {suggestions.length > 0 && (
            <span
              style={{
                backgroundColor: "#fff",
                color: "#2563eb",
                borderRadius: "20px",
                padding: "4px 12px",
                fontSize: "0.75rem",
                fontWeight: 800,
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                minWidth: "28px",
                textAlign: "center",
              }}
            >
              {suggestions.length}
            </span>
          )}
        </div>
        <div style={{
          backgroundColor: "rgba(255,255,255,0.2)",
          borderRadius: "8px",
          padding: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {open ? <ChevronDown size={20} color="#fff" /> : <ChevronRight size={20} color="#fff" />}
        </div>
      </button>

      {/* ── Collapsible body ── */}
      {open && (
        <div style={{ marginTop: "20px" }}>

          {/* Context pill */}
          {formation?.domaine && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                border: "2px solid #3b82f6",
                borderRadius: "24px",
                padding: "8px 20px",
                marginBottom: "20px",
                fontSize: "0.85rem",
                color: "#1e40af",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(59,130,246,0.2)",
              }}
            >
              <span style={{ fontSize: "1.1rem" }}>🎯</span>
              <span style={{ opacity: 0.8 }}>Domaine :</span>
              <span style={{ fontWeight: 700 }}>{formation.domaine}</span>
            </div>
          )}

          {/* Loading */}
          {loading && suggestions.length === 0 && (
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              gap: "12px", 
              color: "#3b82f6", 
              fontSize: "0.9rem", 
              padding: "32px 0",
              fontWeight: 600,
            }}>
              <Loader size={20} className="spin" />
              <span>Analyse des profils en cours...</span>
            </div>
          )}

          {loading && suggestions.length > 0 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#3b82f6",
              fontSize: "0.82rem",
              marginBottom: "12px",
            }}>
              <Loader size={14} className="spin" />
              <span>Actualisation des suggestions...</span>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{
              backgroundColor: "#fee2e2",
              border: "2px solid #ef4444",
              borderRadius: "12px",
              padding: "16px",
              color: "#dc2626",
              fontSize: "0.9rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}>
              <span style={{ fontSize: "1.3rem" }}>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Empty */}
          {!loading && !error && suggestions.length === 0 && (
            <div style={{
              backgroundColor: "#f3f4f6",
              borderRadius: "12px",
              padding: "32px",
              textAlign: "center",
              color: "#6b7280",
            }}>
              <div style={{ fontSize: "3rem", marginBottom: "12px" }}>🔍</div>
              <p style={{ fontSize: "0.95rem", fontWeight: 600, margin: 0 }}>
                Aucune suggestion disponible
              </p>
              <p style={{ fontSize: "0.8rem", margin: "8px 0 0 0", opacity: 0.8 }}>
                Aucun profil ne correspond aux critères de cette formation
              </p>
            </div>
          )}

          {/* Suggestions list */}
          {suggestions.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {suggestions.map((s) => {
                const borderColor = s.score > 75 ? "#10b981" : s.score >= 50 ? "#f59e0b" : "#ef4444";
                const priorityLabel = s.score > 75 ? "Haute priorité" : s.score >= 50 ? "Priorité moyenne" : "Faible priorité";
                
                // Check if formation domain matches job domain
                const domainMatch = s.reasons?.some(r => 
                  r.toLowerCase().includes("domaine") && r.toLowerCase().includes("aligné")
                );
                
                return (
                  <div
                    key={s.id}
                    style={{
                      backgroundColor: "#ffffff",
                      border: `2px solid ${borderColor}`,
                      borderLeft: `8px solid ${borderColor}`,
                      borderRadius: "16px",
                      padding: "20px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                    }}
                  >
                    {/* Employee name header */}
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "20px",
                      paddingBottom: "16px",
                      borderBottom: "2px solid #f1f5f9",
                    }}>
                      <span style={{ fontSize: "1.3rem" }}>👤</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ 
                          fontSize: "1.05rem", 
                          fontWeight: 800, 
                          color: "#0f172a",
                        }}>
                          {s.name || `Employé #${s.id}`}
                        </div>
                        {s.matricule && (
                          <span style={{
                            backgroundColor: "#e0e7ff",
                            color: "#4f46e5",
                            padding: "2px 10px",
                            borderRadius: "8px",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            display: "inline-block",
                            marginTop: "4px",
                          }}>
                            {s.matricule}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* SECTION 1: Job relevance */}
                    <div style={{
                      marginBottom: "16px",
                      padding: "12px",
                      backgroundColor: "#f0f9ff",
                      borderRadius: "12px",
                      border: "1px solid #bae6fd",
                    }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#0369a1", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>💼</span> Pertinence du poste
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {s.job_title && (
                          <div style={{ fontSize: "0.8rem", color: "#475569" }}>
                            <span style={{ fontWeight: 600 }}>Poste actuel:</span> {s.job_title}
                          </div>
                        )}
                        {s.job_domain && (
                          <div style={{ fontSize: "0.8rem", color: "#475569" }}>
                            <span style={{ fontWeight: 600 }}>Domaine:</span> {s.job_domain}
                          </div>
                        )}
                        {domainMatch && (
                          <div style={{ 
                            fontSize: "0.75rem", 
                            color: "#059669",
                            backgroundColor: "#dcfce7",
                            padding: "6px 10px",
                            borderRadius: "8px",
                            marginTop: "4px",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}>
                            <span>✓</span> Formation dans le même domaine que le poste
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SECTION 2: Skills impact */}
                    {(s.covered_skills?.length > 0 || s.missing_skills?.length > 0) && (
                      <div style={{
                        marginBottom: "16px",
                        padding: "12px",
                        backgroundColor: "#fef3c7",
                        borderRadius: "12px",
                        border: "1px solid #fbbf24",
                      }}>
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#92400e", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>🎯</span> Impact sur les compétences
                        </div>
                        
                        {/* Coverage percentage */}
                        {s.coverage_rate != null && (
                          <div style={{ marginBottom: "10px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                              <span style={{ fontSize: "0.7rem", color: "#92400e", fontWeight: 600 }}>Couverture</span>
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#92400e" }}>{s.coverage_rate}%</span>
                            </div>
                            <div style={{ width: "100%", backgroundColor: "#fde68a", borderRadius: "9999px", height: "6px", overflow: "hidden" }}>
                              <div style={{ backgroundColor: "#f59e0b", height: "6px", borderRadius: "9999px", width: `${s.coverage_rate}%`, transition: "width 0.3s ease" }}></div>
                            </div>
                          </div>
                        )}
                        
                        {/* Covered skills */}
                        {s.covered_skills?.length > 0 && (
                          <div style={{ marginBottom: "8px" }}>
                            <div style={{ fontSize: "0.7rem", color: "#059669", fontWeight: 600, marginBottom: "4px" }}>
                              ✓ Compétences couvertes ({s.covered_skills.length})
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              {s.covered_skills.map((skill, i) => (
                                <span key={i} style={{
                                  fontSize: "0.68rem",
                                  backgroundColor: "#dcfce7",
                                  color: "#166534",
                                  padding: "3px 8px",
                                  borderRadius: "8px",
                                  border: "1px solid #86efac",
                                  fontWeight: 600,
                                }}>
                                  ✔ {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Remaining skills */}
                        {s.missing_skills?.length > 0 && (
                          <div>
                            <div style={{ fontSize: "0.7rem", color: "#dc2626", fontWeight: 600, marginBottom: "4px" }}>
                              ⚠ Compétences restantes ({s.missing_skills.length})
                            </div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                              {s.missing_skills.map((skill, i) => (
                                <span key={i} style={{
                                  fontSize: "0.68rem",
                                  backgroundColor: "#fee2e2",
                                  color: "#991b1b",
                                  padding: "3px 8px",
                                  borderRadius: "8px",
                                  border: "1px solid #fca5a5",
                                  fontWeight: 600,
                                }}>
                                  ⚠ {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SECTION 3: Candidate profile */}
                    <div style={{
                      marginBottom: "16px",
                      padding: "12px",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "12px",
                      border: "1px solid #d1d5db",
                    }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#374151", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>📋</span> Profil du candidat
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px" }}>
                        <div style={{ fontSize: "0.75rem", color: "#475569" }}>
                          <div style={{ fontWeight: 600, color: "#6b7280", fontSize: "0.65rem" }}>Formations</div>
                          <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.85rem" }}>{s.formation_count || 0}</div>
                        </div>
                        {s.attendance_rate != null && (
                          <div style={{ fontSize: "0.75rem", color: "#475569" }}>
                            <div style={{ fontWeight: 600, color: "#6b7280", fontSize: "0.65rem" }}>Assiduité</div>
                            <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.85rem" }}>{s.attendance_rate}%</div>
                          </div>
                        )}
                        <div style={{ fontSize: "0.75rem", color: "#475569" }}>
                          <div style={{ fontWeight: 600, color: "#6b7280", fontSize: "0.65rem" }}>Dernière formation</div>
                          <div style={{ fontWeight: 700, color: "#111827", fontSize: "0.85rem" }}>
                            {s.time_since_label != null ? s.time_since_label : "Jamais"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* FINAL SCORE */}
                    <div style={{
                      marginBottom: "16px",
                      padding: "14px",
                      background: `linear-gradient(135deg, ${borderColor}15 0%, ${borderColor}05 100%)`,
                      borderRadius: "12px",
                      border: `2px solid ${borderColor}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                      <div>
                        <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "#6b7280", marginBottom: "2px" }}>
                          SCORE GLOBAL
                        </div>
                        <div style={{ fontSize: "1.8rem", fontWeight: 900, color: borderColor, lineHeight: 1 }}>
                          {s.score}<span style={{ fontSize: "1rem", fontWeight: 700 }}>/100</span>
                        </div>
                      </div>
                      <div style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#fff",
                        background: `linear-gradient(135deg, ${borderColor} 0%, ${borderColor}dd 100%)`,
                        borderRadius: "12px",
                        padding: "8px 16px",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                      }}>
                        {priorityLabel}
                      </div>
                    </div>

                    {/* Add button */}
                    <button
                      type="button"
                      disabled={addingId === s.id}
                      onClick={() => handleAdd(s)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        background: addingId === s.id 
                          ? "linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)" 
                          : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: "12px",
                        padding: "12px 24px",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        cursor: addingId === s.id ? "not-allowed" : "pointer",
                        transition: "all 0.3s ease",
                        boxShadow: addingId === s.id 
                          ? "0 2px 8px rgba(0,0,0,0.1)" 
                          : "0 4px 12px rgba(16, 185, 129, 0.3)",
                        letterSpacing: "0.5px",
                      }}
                      onMouseEnter={(e) => { 
                        if (addingId !== s.id) {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 185, 129, 0.4)";
                        }
                      }}
                      onMouseLeave={(e) => { 
                        if (addingId !== s.id) {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
                        }
                      }}
                    >
                      {addingId === s.id ? <Loader size={16} className="spin" /> : <UserPlus size={18} />}
                      <span>{addingId === s.id ? "Ajout en cours..." : "Ajouter ce candidat"}</span>
                    </button>
                  </div>
                );
              })}

              {/* Refresh */}
              <button
                type="button"
                onClick={() => fetchSuggestions({ forceRefresh: true })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",
                  border: "2px solid #cbd5e1",
                  color: "#475569",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: "10px 20px",
                  borderRadius: "12px",
                  transition: "all 0.3s ease",
                  margin: "0 auto",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#e2e8f0";
                  e.currentTarget.style.borderColor = "#94a3b8";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              >
                <RefreshCw size={16} />
                <span>Actualiser les suggestions</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSuggestionsPanel;
