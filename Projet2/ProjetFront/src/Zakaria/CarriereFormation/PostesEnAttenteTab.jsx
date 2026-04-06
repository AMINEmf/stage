import React, { useRef, useState, useEffect } from "react";
import apiClient from "../../services/apiClient";
import Swal from "sweetalert2";
import "./CareerTraining.css";

const EMPLOYEE_PENDING_POSTES_CACHE_KEY = "cf_employee_pending_postes_cache_v1";
const EMPLOYEE_PENDING_POSTES_CACHE_TTL_MS = 2 * 60 * 1000;
const GLOBAL_PENDING_POSTES_REQUESTS_KEY = "__cf_pending_postes_prefetch_requests";

const getSharedRequestMap = (key) => {
  if (typeof window === "undefined") return null;
  const globalObj = window;
  if (!(globalObj[key] instanceof Map)) {
    globalObj[key] = new Map();
  }
  return globalObj[key];
};

const readPendingPostesStore = () => {
  try {
    const raw = localStorage.getItem(EMPLOYEE_PENDING_POSTES_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const getCachedPendingPostesEntry = (employeeId) => {
  const store = readPendingPostesStore();
  const entry = store[String(employeeId)];
  if (!entry || !Array.isArray(entry.rows)) return null;

  const ts = Number(entry.ts) || 0;
  return {
    ts,
    rows: entry.rows,
    isFresh: ts > 0 && Date.now() - ts <= EMPLOYEE_PENDING_POSTES_CACHE_TTL_MS,
  };
};

const persistPendingPostesEntry = (employeeId, rows) => {
  try {
    const store = readPendingPostesStore();
    store[String(employeeId)] = {
      ts: Date.now(),
      rows: Array.isArray(rows) ? rows : [],
    };
    localStorage.setItem(EMPLOYEE_PENDING_POSTES_CACHE_KEY, JSON.stringify(store));
  } catch {
    // ignore cache write failures
  }
};

const PostesEnAttenteTab = ({ employeeId, onPosteUpdate }) => {
  const [postesEnAttente, setPostesEnAttente] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const localRequestsRef = useRef(new Map());

  useEffect(() => {
    if (!employeeId) {
      setPostesEnAttente([]);
      setLoading(false);
      setErrorMessage("");
      return;
    }

    const cached = getCachedPendingPostesEntry(employeeId);
    if (cached?.rows) {
      setPostesEnAttente(cached.rows);
      setErrorMessage("");
      if (cached.isFresh) {
        setLoading(false);
        return;
      }
    }

    void fetchPostesEnAttente({
      silent: Boolean(cached?.rows?.length),
      forceRefresh: false,
    });
  }, [employeeId]);

  const fetchPostesEnAttente = async ({ silent = false, forceRefresh = false } = {}) => {
    if (!employeeId) return;

    const cached = getCachedPendingPostesEntry(employeeId);
    const cacheKey = String(employeeId);
    const sharedRequests = getSharedRequestMap(GLOBAL_PENDING_POSTES_REQUESTS_KEY);
    if (!forceRefresh && cached?.rows?.length) {
      setPostesEnAttente(cached.rows);
      setErrorMessage("");
      if (cached.isFresh) {
        setLoading(false);
        return;
      }
    }

    const sharedExistingRequest = sharedRequests?.get(cacheKey);
    if (sharedExistingRequest) {
      await sharedExistingRequest;
      const refreshed = getCachedPendingPostesEntry(employeeId);
      if (refreshed?.rows) {
        setPostesEnAttente(refreshed.rows);
        setErrorMessage("");
      }
      setLoading(false);
      return;
    }

    const localExistingRequest = localRequestsRef.current.get(cacheKey);
    if (localExistingRequest) {
      await localExistingRequest;
      return;
    }

    if (!silent && !(cached?.rows?.length)) {
      setLoading(true);
    }

    const request = apiClient
      .get(`/employes/${employeeId}/postes-en-attente`)
      .then((response) => {
        const payload = response?.data;
        let rows = [];
        if (Array.isArray(payload)) {
          rows = payload;
        } else if (Array.isArray(payload?.data)) {
          rows = payload.data;
        }

        setPostesEnAttente(rows);
        setErrorMessage("");
        persistPendingPostesEntry(employeeId, rows);
      })
      .catch((error) => {
        console.error("Erreur lors du chargement des postes en attente:", error);
        if (!cached?.rows?.length) {
          setErrorMessage("Impossible de charger les postes en attente.");
        }
      })
      .finally(() => {
        setLoading(false);
        localRequestsRef.current.delete(cacheKey);
        sharedRequests?.delete(cacheKey);
      });

    localRequestsRef.current.set(cacheKey, request);
    sharedRequests?.set(cacheKey, request);
    await request;
  };

  const handleAcceptPoste = async (posteHistoriqueId) => {
    const result = await Swal.fire({
      title: "Accepter ce poste ?",
      text: "L'employé sera affecté à ce nouveau poste et son ancien poste sera clôturé.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "✔ Accepter",
      cancelButtonText: "Annuler",
    });

    if (!result.isConfirmed) return;

    try {
      await apiClient.post(`/carrieres/${posteHistoriqueId}/accept`);
      
      Swal.fire({
        icon: "success",
        title: "Poste accepté",
        text: "Le poste a été accepté avec succès.",
        showConfirmButton: false,
        timer: 1500,
      });

      // Refresh the list
      void fetchPostesEnAttente({ forceRefresh: true, silent: true });
      
      // Notify parent to refresh the career tab
      if (onPosteUpdate) {
        onPosteUpdate();
      }
    } catch (error) {
      console.error("Erreur lors de l'acceptation du poste:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error.response?.data?.message || "Impossible d'accepter le poste.",
      });
    }
  };

  const handleRefusePoste = async (posteHistoriqueId) => {
    const result = await Swal.fire({
      title: "Refuser ce poste ?",
      text: "Cette action est irréversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "❌ Refuser",
      cancelButtonText: "Annuler",
    });

    if (!result.isConfirmed) return;

    try {
      await apiClient.post(`/carrieres/${posteHistoriqueId}/refuse`);
      
      Swal.fire({
        icon: "success",
        title: "Poste refusé",
        text: "Le poste a été refusé.",
        showConfirmButton: false,
        timer: 1500,
      });

      // Refresh the list
      void fetchPostesEnAttente({ forceRefresh: true, silent: true });
      
      // Notify parent
      if (onPosteUpdate) {
        onPosteUpdate();
      }
    } catch (error) {
      console.error("Erreur lors du refus du poste:", error);
      Swal.fire({
        icon: "error",
        title: "Erreur",
        text: error.response?.data?.message || "Impossible de refuser le poste.",
      });
    }
  };

  if (!employeeId) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
        Sélectionnez un employé pour voir ses postes en attente
      </div>
    );
  }

  if (loading && postesEnAttente.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
        Chargement...
      </div>
    );
  }

  if (errorMessage && postesEnAttente.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#ef4444" }}>
        {errorMessage}
      </div>
    );
  }

  if (postesEnAttente.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
        Aucun poste en attente
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "12px 0" }}>
      {postesEnAttente.map((pending) => (
        <div 
          key={pending.id} 
          style={{ 
            backgroundColor: "#fff", 
            padding: "16px", 
            borderRadius: "8px", 
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "1rem", color: "#334155", marginBottom: "4px" }}>
                {pending.poste || "—"}
              </div>
              {pending.grade && (
                <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "2px" }}>
                  Grade: {pending.grade}
                </div>
              )}
              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                Proposé le: {pending.date_proposition || "—"}
              </div>
            </div>
            {pending.type_evolution && (
              <span className="career-badge info" style={{ fontSize: "0.75rem" }}>
                {pending.type_evolution}
              </span>
            )}
          </div>
          
          {/* Competences requises */}
          {(() => {
            const competences = Array.isArray(pending.competences_requises) ? pending.competences_requises : [];
            if (competences.length > 0) {
              return (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569", marginBottom: "8px" }}>
                    Compétences requises:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {competences.map((comp) => (
                      <span 
                        key={comp.id}
                        style={{ 
                          fontSize: "0.8rem", 
                          padding: "4px 12px", 
                          borderRadius: "16px",
                          backgroundColor: "#f1f5f9",
                          color: "#475569",
                          border: "1px solid #e2e8f0",
                          fontWeight: 500
                        }}
                      >
                        {comp.nom}
                        {comp.niveau_requis && (
                          <span style={{ color: "#0ea5e9", marginLeft: "4px", fontWeight: 600 }}>
                            {comp.niveau_requis}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              onClick={() => handleAcceptPoste(pending.id)}
              style={{
                flex: 1,
                backgroundColor: "#16a34a",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background-color 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#15803d"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#16a34a"}
            >
              ✔ Accepter
            </button>
            <button
              type="button"
              onClick={() => handleRefusePoste(pending.id)}
              style={{
                flex: 1,
                backgroundColor: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 16px",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background-color 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#b91c1c"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "#dc2626"}
            >
              ❌ Refuser
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostesEnAttenteTab;
