import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Box, ThemeProvider, createTheme } from "@mui/material";
import { ArrowLeft, UserPlus, Trash2, X, Eye, User, BookOpen, ClipboardList } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";
import Select from "react-select";
import apiClient from "../../services/apiClient";
import { useHeader } from "../../Acceuil/HeaderContext";
import { useOpen } from "../../Acceuil/OpenProvider";
import ExpandRTable from "../Employe/ExpandRTable";
import SectionTitle from "../CNSS/SectionTitle";
import "../Style.css";
import "./CareerTraining.css";

const STATUT_OPTIONS = ["En attente", "En cours", "Termine", "Annule"];
const FORMATION_CACHE_TTL_MS = 2 * 60 * 1000;
const PARTICIPANTS_CACHE_TTL_MS = 10 * 60 * 1000;
const EMPLOYEES_CACHE_TTL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 20000;
const FAST_REQUEST_TIMEOUT_MS = 10000;
const PARTICIPANTS_ENRICH_FALLBACK_DELAY_MS = 2500;
const EMPLOYEES_CACHE_KEY = "cf_employees_list_cache_v1";
const inFlightRequests = new Map();

const dedupeRequest = async (key, requestFactory) => {
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }

  const promise = Promise.resolve()
    .then(requestFactory)
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, promise);
  return promise;
};

const readTimedCache = (key, ttlMs) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.ts !== "number") return null;
    if (Date.now() - parsed.ts > ttlMs) return null;
    return parsed.data;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug("Cache read failed:", key, error);
    }
    return null;
  }
};

const writeTimedCache = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.debug("Cache write failed:", key, error);
    }
  }
};

const hasAttendanceStats = (row) => {
  if (!row || typeof row !== "object") return false;
  return (
    Object.hasOwn(row, "total_sessions") ||
    Object.hasOwn(row, "total_present") ||
    Object.hasOwn(row, "total_absent") ||
    Object.hasOwn(row, "total_retard") ||
    Object.hasOwn(row, "attendance_rate")
  );
};

const mergeParticipantsWithAttendance = (baseList, attendanceList) => {
  const safeBase = Array.isArray(baseList) ? baseList : [];
  const safeAttendance = Array.isArray(attendanceList) ? attendanceList : [];

  if (safeBase.length === 0) return safeAttendance;
  if (safeAttendance.length === 0) return safeBase;

  const byId = new Map();
  const byEmployee = new Map();

  safeAttendance.forEach((row) => {
    if (row?.id != null) byId.set(Number(row.id), row);
    if (row?.employe_id != null) byEmployee.set(Number(row.employe_id), row);
  });

  return safeBase.map((row) => {
    let enriched = null;

    if (row?.id !== null && row?.id !== undefined) {
      enriched = byId.get(Number(row.id)) || null;
    }

    if (!enriched && row?.employe_id !== null && row?.employe_id !== undefined) {
      enriched = byEmployee.get(Number(row.employe_id)) || null;
    }

    return enriched ? { ...row, ...enriched } : row;
  });
};

const StatusBadge = ({ status }) => {
  const cls = status === "Termine" ? "success" : status === "En cours" ? "info" : "warning";
  return <span className={`career-badge ${cls}`}>{status || "—"}</span>;
};

const FormationParticipantsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { setTitle, clearActions, searchQuery } = useHeader();
  const { dynamicStyles } = useOpen();
  const formationTimeoutUntilRef = useRef(0);

  const [formation, setFormation] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const locationFormation = useMemo(() => {
    const stateFormation = location?.state?.formation;
    return stateFormation && Number(stateFormation.id) === Number(id) ? stateFormation : null;
  }, [id, location?.state?.formation?.id]);

  const locationParticipants = useMemo(() => {
    const stateParticipants = location?.state?.participants;
    return Array.isArray(stateParticipants) ? stateParticipants : null;
  }, [location?.state?.participants]);

  const fromParticipantsLink = Boolean(location?.state?.fromParticipantsLink);

  const formationCacheKey = useMemo(() => `cf_formation_details_cache_v1:${id}`, [id]);
  const participantsCacheKey = useMemo(() => `cf_formation_participants_cache_v1:${id}`, [id]);

  const persistParticipantsCache = useCallback((list) => {
    writeTimedCache(participantsCacheKey, Array.isArray(list) ? list : []);
  }, [participantsCacheKey]);

  // Unified drawer: null | "add" | "edit" | "details"
  const [drawerMode, setDrawerMode] = useState(null);
  const [drawerParticipant, setDrawerParticipant] = useState(null);

  // Add form
  const [selectedEmploye, setSelectedEmploye] = useState(null);
  const [addStatut, setAddStatut] = useState("En attente");
  const [addNote, setAddNote] = useState("");
  const [addCommentaire, setAddCommentaire] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState({ statut: "", note: "", commentaire: "" });
  const [saving, setSaving] = useState(false);

  // Table state
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const openAdd = useCallback(() => {
    setDrawerParticipant(null);
    setSelectedEmploye(null);
    setAddStatut("En attente");
    setAddNote("");
    setAddCommentaire("");
    setDrawerMode("add");
  }, []);

  const openEdit = useCallback((p) => {
    setDrawerParticipant(p);
    setEditForm({ statut: p.statut || "", note: p.note || "", commentaire: p.commentaire || "" });
    setDrawerMode("edit");
  }, []);

  const openDetails = useCallback((p) => {
    setDrawerParticipant(p);
    setDrawerMode("details");
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerMode(null);
    setDrawerParticipant(null);
  }, []);

  useEffect(() => {
    setTitle("Participants de la formation");
    return () => clearActions();
  }, [setTitle, clearActions]);

  const fetchFormation = useCallback(async ({ silent = false, force = false } = {}) => {
    if (!force && Date.now() < formationTimeoutUntilRef.current) {
      return null;
    }

    try {
      const res = await dedupeRequest(`formation:${id}:compact`, () =>
        apiClient.get(`/formations/${id}/summary`, {
          timeout: REQUEST_TIMEOUT_MS,
        })
      );
      const data = res.data ?? null;
      setFormation(data);
      writeTimedCache(formationCacheKey, data);
      return data;
    } catch (err) {
      const isTimeout = err?.code === "ECONNABORTED";
      if (isTimeout) {
        formationTimeoutUntilRef.current = Date.now() + 60 * 1000;
      }
      if (!silent && !isTimeout) {
        console.error("Error loading formation:", err);
      }
      return null;
    }
  }, [id, formationCacheKey]);

  const fetchParticipantsBasic = useCallback(async ({ silent = false } = {}) => {
    try {
      const res = await dedupeRequest(`formation:${id}:participants:basic`, () =>
        apiClient.get(`/formations/${id}/participants`, { timeout: FAST_REQUEST_TIMEOUT_MS })
      );
      const list = Array.isArray(res.data) ? res.data : [];

      setParticipants((prev) => {
        const merged = mergeParticipantsWithAttendance(list, prev);
        persistParticipantsCache(merged);
        return merged;
      });

      return {
        list,
        ok: true,
        timedOut: false,
      };
    } catch (err) {
      const isTimeout = err?.code === "ECONNABORTED";
      if (!silent && !isTimeout) {
        console.error("Error loading participants (basic):", err);
      }
      return {
        list: [],
        ok: false,
        timedOut: isTimeout,
      };
    }
  }, [id, persistParticipantsCache]);

  const fetchParticipantsWithAttendance = useCallback(async ({ silent = false } = {}) => {
    try {
      const res = await dedupeRequest(`formation:${id}:participants:attendance`, () =>
        apiClient.get(`/formations/${id}/participants-with-attendance`, { timeout: REQUEST_TIMEOUT_MS })
      );
      const list = Array.isArray(res.data) ? res.data : [];

      setParticipants((prev) => {
        const source = Array.isArray(prev) && prev.length > 0 ? prev : list;
        const merged = mergeParticipantsWithAttendance(source, list);
        persistParticipantsCache(merged);
        return merged;
      });

      return list;
    } catch (err) {
      const isTimeout = err?.code === "ECONNABORTED";
      if (!silent && !isTimeout) {
        console.error("Error loading participants (attendance):", err);
      }
      return null;
    }
  }, [id, persistParticipantsCache]);

  const fetchEmployees = useCallback(async () => {
    const cached = readTimedCache(EMPLOYEES_CACHE_KEY, EMPLOYEES_CACHE_TTL_MS);
    if (Array.isArray(cached)) {
      setEmployees(cached);
      return cached;
    }

    setLoadingEmployees(true);
    try {
      const res = await dedupeRequest("employes:list", () =>
        apiClient.get("/employes/list", { timeout: REQUEST_TIMEOUT_MS })
      );
      const list = Array.isArray(res.data) ? res.data : [];
      setEmployees(list);
      writeTimedCache(EMPLOYEES_CACHE_KEY, list);
      return list;
    } catch (err) {
      if (err?.code !== "ECONNABORTED") {
        console.error("Error loading employees:", err);
      }
      return [];
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    const cachedFormation = readTimedCache(formationCacheKey, FORMATION_CACHE_TTL_MS);
    const cachedParticipants = readTimedCache(participantsCacheKey, PARTICIPANTS_CACHE_TTL_MS);
    const warmParticipants = Array.isArray(cachedParticipants)
      ? cachedParticipants
      : Array.isArray(locationParticipants)
      ? locationParticipants
      : null;
    const warmFormation = cachedFormation || locationFormation;
    const inferredNoParticipants = Number(warmFormation?.participants_count ?? -1) === 0;
    const cachedNeedsAttendance =
      Array.isArray(warmParticipants) &&
      warmParticipants.some((row) => !hasAttendanceStats(row));

    if (warmFormation) {
      setFormation(warmFormation);
      if (!cachedFormation) {
        writeTimedCache(formationCacheKey, warmFormation);
      }
    }
    if (Array.isArray(warmParticipants)) {
      setParticipants(warmParticipants);
      if (!Array.isArray(cachedParticipants)) {
        writeTimedCache(participantsCacheKey, warmParticipants);
      }
    } else if (inferredNoParticipants) {
      setParticipants([]);
      writeTimedCache(participantsCacheKey, []);
    }

    // Keep table responsive; background refresh should not block rendering.
    setLoading(false);

    let cancelled = false;

    const refreshParticipants = async () => {
      const knownParticipantsCount = Number(warmFormation?.participants_count);
      const hasKnownParticipantsCount =
        Number.isFinite(knownParticipantsCount) && knownParticipantsCount >= 0;

      let attendanceRequested = false;
      let basicResolved = false;
      let fallbackTimer = null;

      const requestAttendance = () => {
        if (cancelled || attendanceRequested) return;
        attendanceRequested = true;
        fetchParticipantsWithAttendance({ silent: true });
      };

      const shouldScheduleEarlyFallback =
        cachedNeedsAttendance ||
        !hasKnownParticipantsCount ||
        knownParticipantsCount > 0;

      const shouldPrioritizeLinkOpen =
        fromParticipantsLink &&
        !Array.isArray(cachedParticipants) &&
        !Array.isArray(locationParticipants) &&
        (!hasKnownParticipantsCount || knownParticipantsCount > 0);

      if (shouldPrioritizeLinkOpen) {
        requestAttendance();
      }

      // Trigger enrichment automatically if the fast endpoint does not answer quickly.
      if (shouldScheduleEarlyFallback) {
        fallbackTimer = window.setTimeout(() => {
          if (!basicResolved) {
            requestAttendance();
          }
        }, PARTICIPANTS_ENRICH_FALLBACK_DELAY_MS);
      }

      const basicResult = await fetchParticipantsBasic({ silent: true });
      basicResolved = true;

      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }

      if (cancelled) return;

      const basicList = Array.isArray(basicResult?.list) ? basicResult.list : [];
      const shouldEnrich =
        basicResult?.ok === false ||
        basicList.length > 0 ||
        cachedNeedsAttendance ||
        !hasKnownParticipantsCount ||
        knownParticipantsCount > 0;

      if (shouldEnrich) {
        requestAttendance();
      }
    };

    // Formation details refresh runs in background and must not block table rendering.
    if (!warmFormation) {
      fetchFormation({ silent: true });
    }

    // Skip first participants fetch when we already know the formation has no participants.
    if (!inferredNoParticipants || Array.isArray(warmParticipants) || !warmFormation) {
      refreshParticipants();
    }

    return () => {
      cancelled = true;
    };
  }, [
    fetchFormation,
    fetchParticipantsBasic,
    fetchParticipantsWithAttendance,
    formationCacheKey,
    participantsCacheKey,
    locationFormation,
    locationParticipants,
    fromParticipantsLink,
  ]);

  useEffect(() => {
    if (drawerMode !== "add") return;
    if (employees.length > 0 || loadingEmployees) return;
    fetchEmployees();
  }, [drawerMode, employees.length, loadingEmployees, fetchEmployees]);

  // Filter employees already in the formation
  const availableEmployees = useMemo(() => {
    const participantIds = new Set(participants.map((p) => p.employe_id));
    const internalTrainerId = formation?.type === "Interne" ? Number(formation?.formateur_employe_id) : null;
    return employees.filter((emp) => {
      if (participantIds.has(emp.id)) return false;
      if (internalTrainerId && Number(emp.id) === internalTrainerId) return false;
      return true;
    });
  }, [employees, participants, formation]);

  const employeeOptions = useMemo(() => {
    return availableEmployees.map((emp) => ({
      value: emp.id,
      label: `${emp.nom} ${emp.prenom} (${emp.matricule || ""})`,
      emp,
    }));
  }, [availableEmployees]);

  // Search filter
  const filteredParticipants = useMemo(() => {
    if (!searchQuery?.trim()) return participants;
    const term = searchQuery.toLowerCase();
    return participants.filter((p) =>
      [p.employe, p.matricule, p.departement, p.statut, p.commentaire]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term))
    );
  }, [participants, searchQuery]);

  const handleAddParticipant = async () => {
    if (!selectedEmploye) return;
    setSubmitting(true);
    try {
      const res = await apiClient.post(`/formations/${id}/participants`, {
        employe_id: selectedEmploye.value,
        statut: addStatut,
        note: addNote || null,
        commentaire: addCommentaire || null,
      });
      setParticipants((prev) => {
        const next = [...prev, res.data];
        persistParticipantsCache(next);
        return next;
      });
      setSelectedEmploye(null);
      setAddStatut("En attente");
      setAddNote("");
      setAddCommentaire("");
      closeDrawer();
      Swal.fire({ icon: "success", title: "Participant ajouté", timer: 1200, showConfirmButton: false });
    } catch (err) {
      const msg = err.response?.data?.message || "Erreur lors de l'ajout";
      Swal.fire({ icon: "error", title: "Erreur", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteParticipant = async (participant) => {
    const result = await Swal.fire({
      title: "Retirer ce participant ?",
      text: `${participant.employe} sera retiré de cette formation.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Retirer",
      cancelButtonText: "Annuler",
    });
    if (!result.isConfirmed) return;

    try {
      await apiClient.delete(`/formations/${id}/participants/${participant.id}`);
      setParticipants((prev) => {
        const next = prev.filter((p) => p.id !== participant.id);
        persistParticipantsCache(next);
        return next;
      });
      setDrawerParticipant((prev) => (prev?.id === participant.id ? null : prev));
      if (drawerParticipant?.id === participant.id) setDrawerMode(null);
      Swal.fire({ icon: "success", title: "Participant retiré", timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erreur", text: "Impossible de retirer le participant." });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    const result = await Swal.fire({
      title: `Retirer ${selectedItems.length} participant(s) ?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Retirer",
      cancelButtonText: "Annuler",
    });
    if (!result.isConfirmed) return;

    try {
      await Promise.all(selectedItems.map((pid) => apiClient.delete(`/formations/${id}/participants/${pid}`)));
      setParticipants((prev) => {
        const next = prev.filter((p) => !selectedItems.includes(p.id));
        persistParticipantsCache(next);
        return next;
      });
      if (drawerParticipant && selectedItems.includes(drawerParticipant.id)) setDrawerMode(null);
      setDrawerParticipant((prev) => (prev && selectedItems.includes(prev.id) ? null : prev));
      setSelectedItems([]);
      Swal.fire({ icon: "success", title: "Participants retirés", timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erreur", text: "Erreur lors de la suppression." });
    }
  };

  const saveEdit = async () => {
    if (!drawerParticipant) return;
    setSaving(true);
    try {
      await apiClient.put(`/formations/${id}/participants/${drawerParticipant.id}`, editForm);
      const updated = { ...drawerParticipant, ...editForm };
      setParticipants((prev) => {
        const next = prev.map((p) => (p.id === drawerParticipant.id ? updated : p));
        persistParticipantsCache(next);
        return next;
      });
      setDrawerParticipant(updated);
      setDrawerMode("details");
      Swal.fire({ icon: "success", title: "Modifié", timer: 1000, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erreur", text: "Erreur lors de la modification." });
    } finally {
      setSaving(false);
    }
  };

  // ─── ExpandRTable: pagination handlers ───
  const handleChangePage = useCallback((newPage) => setCurrentPage(newPage), []);
  const handleChangeRowsPerPage = useCallback((e) => {
    setItemsPerPage(parseInt(e.target.value, 10));
    setCurrentPage(0);
  }, []);

  const handleSelectAllChange = useCallback(
    (checked) => {
      setSelectedItems(checked ? filteredParticipants.map((p) => p.id) : []);
    },
    [filteredParticipants]
  );

  const handleCheckboxChange = useCallback((pid) => {
    setSelectedItems((prev) =>
      prev.includes(pid) ? prev.filter((x) => x !== pid) : [...prev, pid]
    );
  }, []);

  // ─── Attendance badge helper ───
  const AttendanceBadge = ({ rate }) => {
    if (rate == null) return <span style={{ color: "#9ca3af" }}>—</span>;
    const color = rate > 85 ? "#16a34a" : rate >= 60 ? "#d97706" : "#dc2626";
    const bg    = rate > 85 ? "#dcfce7" : rate >= 60 ? "#fef3c7" : "#fee2e2";
    return (
      <span style={{ padding: "2px 8px", borderRadius: "12px", backgroundColor: bg, color, fontWeight: 700, fontSize: "0.78rem" }}>
        🎯 {rate}%
      </span>
    );
  };

  // ─── Columns definition for ExpandRTable (no inline editing) ───
  const columns = useMemo(() => [
    { key: "matricule",   label: "Matricule",   render: (p) => <span>{p.matricule || "—"}</span> },
    {
      key: "employe",
      label: "Employé",
      render: (p) => <span style={{ fontWeight: 600 }}>{p.employe || "—"}</span>,
    },
    { key: "departement", label: "Département", render: (p) => <span>{p.departement || "—"}</span> },
    {
      key: "statut",
      label: "Statut",
      render: (p) => <StatusBadge status={p.statut} />,
    },
    {
      key: "note",
      label: "Note",
      render: (p) => <span>{p.note || "—"}</span>,
    },
    {
      key: "commentaire",
      label: "Commentaire",
      render: (p) => <span>{p.commentaire || "—"}</span>,
    },
    { key: "total_present",   label: "Présences", render: (p) => <span>{p.total_present ?? "—"}</span> },
    { key: "total_absent",    label: "Absences",  render: (p) => <span>{p.total_absent  ?? "—"}</span> },
    { key: "attendance_rate", label: "Assiduité", render: (p) => <AttendanceBadge rate={p.attendance_rate} /> },
  ], []);

  const isFull = formation?.effectif && participants.length >= formation.effectif;
  const isDrawerOpen = drawerMode !== null;

  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{ ...dynamicStyles, minHeight: "100vh", backgroundColor: "#ffffff" }}>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 0,
            mt: 12,
            height: "calc(100vh - 130px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              height: "100%",
              overflow: "hidden",
              gap: isDrawerOpen ? "10px" : "0",
              padding: "8px",
              boxSizing: "border-box",
            }}
          >
            {/* ── LEFT: Main content ── */}
            <div
              style={{
                flex: isDrawerOpen ? "0 0 60%" : "1 1 100%",
                overflowY: "auto",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                padding: "0 20px 20px",
                backgroundColor: "white",
              }}
            >
              {/* ── Section header (matches other modules) ── */}
              <div className="section-header mb-3" style={{ borderBottom: "none", paddingBottom: "15px", margin: "0.5% 0 1%" }}>
                <div className="d-flex align-items-center justify-content-between" style={{ gap: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                      onClick={() => navigate(-1)}
                      style={{
                        background: "none",
                        border: "1px solid #d1d5db",
                        borderRadius: "8px",
                        padding: "6px 10px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        color: "#374151",
                        fontSize: "0.85rem",
                        flexShrink: 0,
                      }}
                    >
                      <ArrowLeft size={16} /> Retour
                    </button>
                    <div>
                      <SectionTitle icon="fas fa-users" text={formation?.titre || "Participants"} />
                      <p className="section-description text-muted mb-0" style={{ fontSize: "0.8rem" }}>
                        {formation?.code && <span>{formation.code} · </span>}
                        {formation?.domaine && <span>{formation.domaine} · </span>}
                        {formation?.type && <span>{formation.type}</span>}
                        {formation?.statut && (
                          <span
                            className={`career-badge ms-2 ${
                              formation.statut === "Termine" ? "success" : formation.statut === "En cours" ? "info" : "warning"
                            }`}
                          >
                            {formation.statut}
                          </span>
                        )}
                        <span style={{ marginLeft: "8px" }}>
                          · {filteredParticipants.length}
                          {formation?.effectif ? ` / ${formation.effectif}` : ""} participant{filteredParticipants.length !== 1 ? "s" : ""}
                          {isFull && <span style={{ color: "#dc2626", fontWeight: 600, marginLeft: "6px" }}>(Complet)</span>}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {selectedItems.length > 0 && (
                      <button
                        className="btn btn-sm"
                        style={{
                          display: "flex", alignItems: "center", gap: "6px",
                          color: "#ef4444", border: "1px solid #fca5a5", borderRadius: "6px",
                          padding: "5px 12px", fontSize: "0.82rem",
                        }}
                        onClick={handleDeleteSelected}
                      >
                        <Trash2 size={14} /> Retirer sélection ({selectedItems.length})
                      </button>
                    )}
                    <button
                      className="cnss-btn-primary"
                      style={{ display: "flex", alignItems: "center", gap: "6px" }}
                      onClick={() => { closeDrawer(); openAdd(); }}
                      disabled={isFull}
                      title={isFull ? "Capacité maximale atteinte" : ""}
                    >
                      <UserPlus size={16} /> Ajouter un participant
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Table ── */}
              <ExpandRTable
                columns={columns}
                data={filteredParticipants}
                loading={loading && filteredParticipants.length === 0}
                searchTerm=""
                selectAll={
                  selectedItems.length === filteredParticipants.length &&
                  filteredParticipants.length > 0
                }
                selectedItems={selectedItems}
                handleSelectAllChange={handleSelectAllChange}
                handleCheckboxChange={handleCheckboxChange}
                handleDeleteSelected={handleDeleteSelected}
                rowsPerPage={itemsPerPage}
                page={currentPage}
                handleChangePage={handleChangePage}
                handleChangeRowsPerPage={handleChangeRowsPerPage}
                noDataMessage="Aucun participant inscrit à cette formation."
                canEdit={false}
                canDelete={false}
                canBulkDelete={false}
                renderCustomActions={(p) => (
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    <button
                      className="btn btn-sm"
                      style={{ color: "#3a8a90", padding: "2px 6px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openDetails(p);
                      }}
                      title="Voir détails"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ color: "#3b82f6", padding: "2px 6px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(p);
                      }}
                      title="Modifier"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ color: "#ef4444", padding: "2px 6px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteParticipant(p);
                      }}
                      title="Retirer"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                )}
                expandedRows={[]}
                toggleRowExpansion={() => {}}
                renderExpandedRow={() => null}
              />
            </div>

            {/* ── RIGHT: Details drawer ── */}
            {drawerMode === "details" && drawerParticipant && (
              <div
                style={{
                  flex: "0 0 38%",
                  overflowY: "auto",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  className="cnss-side-panel"
                  style={{ position: "relative", top: "auto", left: "auto", width: "100%", height: "100%", boxShadow: "none", borderRadius: 0, zIndex: "auto" }}
                >
                  <div className="cnss-form-header">
                    <div style={{ width: "24px" }} />
                    <h5>Fiche participant</h5>
                    <button className="cnss-close-btn" onClick={closeDrawer} type="button">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="cnss-form-body">

                    {/* ── Identité ── */}
                    <div className="cnss-section-title">
                      <User size={14} />
                      <span>Identité</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 20px", marginBottom: "20px" }}>
                      {[
                        { label: "Employé",      value: drawerParticipant.employe },
                        { label: "Matricule",    value: drawerParticipant.matricule },
                        { label: "Département",  value: drawerParticipant.departement },
                        { label: "Inscrit le",   value: drawerParticipant.created_at
                            ? new Date(drawerParticipant.created_at).toLocaleDateString("fr-FR")
                            : "—" },
                      ].map((row) => (
                        <div key={row.label}>
                          <span style={{ fontSize: "0.74rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{row.label}</span>
                          <p style={{ margin: "3px 0 0", fontSize: "0.9rem", color: "#111827", fontWeight: row.label === "Employé" ? 700 : 400 }}>{row.value || "—"}</p>
                        </div>
                      ))}
                    </div>

                    {/* ── Formation ── */}
                    <div className="cnss-section-title">
                      <BookOpen size={14} />
                      <span>Formation concernée</span>
                    </div>
                    <div style={{ backgroundColor: "#f0f9ff", border: "1px solid #bfdbfe", borderRadius: "8px", padding: "12px 14px", marginBottom: "20px" }}>
                      <p style={{ margin: 0, fontWeight: 700, color: "#1e40af", fontSize: "0.95rem" }}>{formation?.titre || "—"}</p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                        {formation?.code && <span style={{ backgroundColor: "#dbeafe", color: "#1d4ed8", borderRadius: "12px", padding: "2px 10px", fontSize: "0.75rem", fontWeight: 600 }}>{formation.code}</span>}
                        {formation?.domaine && <span style={{ backgroundColor: "#e0f2fe", color: "#0369a1", borderRadius: "12px", padding: "2px 10px", fontSize: "0.75rem" }}>{formation.domaine}</span>}
                        {formation?.type && <span style={{ backgroundColor: "#f0fdf4", color: "#15803d", borderRadius: "12px", padding: "2px 10px", fontSize: "0.75rem" }}>{formation.type}</span>}
                      </div>
                      {(formation?.date_debut || formation?.date_fin) && (
                        <p style={{ margin: "8px 0 0", fontSize: "0.8rem", color: "#374151" }}>
                          📅 {formation.date_debut ? new Date(formation.date_debut).toLocaleDateString("fr-FR") : "?"}
                          {" → "}
                          {formation.date_fin ? new Date(formation.date_fin).toLocaleDateString("fr-FR") : "?"}
                        </p>
                      )}
                    </div>

                    {/* ── Statut de participation ── */}
                    <div className="cnss-section-title">
                      <ClipboardList size={14} />
                      <span>Statut de participation</span>
                    </div>

                    {/* Statut visuel */}
                    <div style={{ marginBottom: "20px" }}>
                      <span style={{ fontSize: "0.74rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Statut</span>
                      <div style={{ marginTop: "6px" }}>
                        <StatusBadge status={drawerParticipant.statut} />
                      </div>
                    </div>

                    {/* Note */}
                    <div style={{ marginBottom: "14px" }}>
                      <span style={{ fontSize: "0.74rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Note</span>
                      <div style={{ marginTop: "4px", padding: "8px 12px", backgroundColor: "#f9fafb", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.9rem", color: "#111827" }}>
                        {drawerParticipant.note || <em style={{ color: "#9ca3af" }}>Non renseignée</em>}
                      </div>
                    </div>

                    {/* Commentaire */}
                    <div style={{ marginBottom: "14px" }}>
                      <span style={{ fontSize: "0.74rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Commentaire</span>
                      <div style={{ marginTop: "4px", padding: "8px 12px", backgroundColor: "#f9fafb", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.9rem", color: "#111827", minHeight: "56px" }}>
                        {drawerParticipant.commentaire || <em style={{ color: "#9ca3af" }}>Aucun commentaire</em>}
                      </div>
                    </div>

                    {/* Attestation */}
                    <div>
                      <span style={{ fontSize: "0.74rem", color: "#6b7280", fontWeight: 600, textTransform: "uppercase" }}>Attestation</span>
                      <div style={{ marginTop: "6px" }}>
                        {drawerParticipant.attestation ? (
                          <span style={{ backgroundColor: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0", borderRadius: "20px", padding: "4px 14px", fontSize: "0.82rem", fontWeight: 600 }}>
                            ✓ Délivrée
                          </span>
                        ) : (
                          <span style={{ backgroundColor: "#f9fafb", color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: "20px", padding: "4px 14px", fontSize: "0.82rem" }}>
                            Non délivrée
                          </span>
                        )}
                      </div>
                    </div>

                  </div>

                  <div className="cnss-form-footer">
                    <button
                      type="button"
                      className="cnss-btn-secondary"
                      onClick={closeDrawer}
                    >
                      Fermer
                    </button>
                    <button
                      type="button"
                      className="cnss-btn-primary"
                      onClick={() => openEdit(drawerParticipant)}
                    >
                      Modifier
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── RIGHT: Edit participant drawer ── */}
            {drawerMode === "edit" && drawerParticipant && (
              <div
                style={{
                  flex: "0 0 38%",
                  overflowY: "auto",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  className="cnss-side-panel"
                  style={{ position: "relative", top: "auto", left: "auto", width: "100%", height: "100%", boxShadow: "none", borderRadius: 0, zIndex: "auto" }}
                >
                  <div className="cnss-form-header">
                    <div style={{ width: "24px" }} />
                    <h5>Modifier le participant</h5>
                    <button className="cnss-close-btn" onClick={closeDrawer} type="button">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="cnss-form-body" style={{ padding: "16px" }}>
                    {/* Read-only identity */}
                    <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "12px 14px", marginBottom: "20px" }}>
                      <p style={{ margin: 0, fontWeight: 700, color: "#111827", fontSize: "0.95rem" }}>{drawerParticipant.employe}</p>
                      <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#6b7280" }}>{drawerParticipant.matricule} · {drawerParticipant.departement}</p>
                    </div>

                    <div className="mb-3">
                      <label className="cnss-form-label">Statut</label>
                      <select
                        className="form-select form-select-sm"
                        value={editForm.statut}
                        onChange={(e) => setEditForm((f) => ({ ...f, statut: e.target.value }))}
                      >
                        {STATUT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="cnss-form-label">Note</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={editForm.note}
                        onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))}
                        placeholder="Ex: 16/20"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="cnss-form-label">Commentaire</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows={3}
                        value={editForm.commentaire}
                        onChange={(e) => setEditForm((f) => ({ ...f, commentaire: e.target.value }))}
                        placeholder="Commentaire optionnel"
                      />
                    </div>
                  </div>

                  <div className="cnss-form-footer">
                    <button type="button" className="cnss-btn-secondary" onClick={() => openDetails(drawerParticipant)}>
                      Retour
                    </button>
                    <button
                      type="button"
                      className="cnss-btn-primary"
                      onClick={saveEdit}
                      disabled={saving}
                    >
                      {saving ? "Enregistrement..." : "Enregistrer"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── RIGHT: Add participant panel ── */}
            {drawerMode === "add" && (
              <div
                style={{
                  flex: "0 0 38%",
                  overflowY: "auto",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  className="cnss-side-panel"
                  style={{ position: "relative", top: "auto", left: "auto", width: "100%", height: "100%", boxShadow: "none", borderRadius: 0, zIndex: "auto" }}
                >
                  <div className="cnss-form-header">
                    <div style={{ width: "24px" }} />
                    <h5>Ajouter un participant</h5>
                    <button className="cnss-close-btn" onClick={closeDrawer} type="button">
                      <X size={20} />
                    </button>
                  </div>

                  <div className="cnss-form-body" style={{ padding: "16px" }}>
                    <div className="mb-3">
                      <label className="cnss-form-label">Employé *</label>
                      <Select
                        options={employeeOptions}
                        value={selectedEmploye}
                        onChange={setSelectedEmploye}
                        placeholder={loadingEmployees ? "Chargement des employés..." : "Rechercher un employé..."}
                        isLoading={loadingEmployees}
                        isClearable
                        noOptionsMessage={() => (loadingEmployees ? "Chargement des employés..." : "Aucun employé disponible")}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="cnss-form-label">Statut</label>
                      <select
                        className="form-select form-select-sm"
                        value={addStatut}
                        onChange={(e) => setAddStatut(e.target.value)}
                      >
                        {STATUT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="cnss-form-label">Note</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={addNote}
                        onChange={(e) => setAddNote(e.target.value)}
                        placeholder="Ex: 16/20"
                      />
                    </div>

                    <div className="mb-3">
                      <label className="cnss-form-label">Commentaire</label>
                      <textarea
                        className="form-control form-control-sm"
                        rows={3}
                        value={addCommentaire}
                        onChange={(e) => setAddCommentaire(e.target.value)}
                        placeholder="Commentaire optionnel"
                      />
                    </div>
                  </div>

                  <div className="cnss-form-footer">
                    <button type="button" className="cnss-btn-secondary" onClick={closeDrawer}>
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="cnss-btn-primary"
                      onClick={handleAddParticipant}
                      disabled={!selectedEmploye || submitting}
                    >
                      {submitting ? "Ajout..." : "Ajouter"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default FormationParticipantsPage;
