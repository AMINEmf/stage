import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Box, ThemeProvider, createTheme } from "@mui/material";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Select from "react-dropdown-select";
import Swal from "sweetalert2";
import apiClient from "../../services/apiClient";
import { useHeader } from "../../Acceuil/HeaderContext";
import { useOpen } from "../../Acceuil/OpenProvider";
import TrainingCatalog from "./TrainingCatalog";
import ManageResourceModal from "../CNSS/ManageResourceModal";
import SmartSuggestionsPanel from "./features/formations/components/SmartSuggestionsPanel";
import SessionsSection from "./features/formations/components/SessionsSection";
import AttendanceView from "./features/formations/components/AttendanceView";
import { prefetchFormationSessions } from "./features/formations/useFormationSessions";
import { prefetchSmartSuggestions } from "./features/formations/useSmartSuggestions";
import { STATUTS_CYCLE_FORMATION, STATUTS_CYCLE_FORMATION_LIST } from "../../constants/status";
import "./CareerTraining.css";
import "../Style.css";
import "../CNSS/CnssForm.css";

const EMPTY_FORM = {
  code: "",
  titre: "",
  domaine: "",
  type: "",
  mode_formation: "",
  duree: "",
  statut: STATUTS_CYCLE_FORMATION.PLANIFIEE,
  date_debut: "",
  date_fin: "",
  budget: "",
  organisme: "",
  effectif: "",
  formateur_employe_id: "",
  formateur_id: "",
  competence_ids: [],
};

const INITIAL_DOMAINE_OPTIONS = ["Informatique", "Management", "Comptabilite", "RH", "Juridique", "Technique"];
const STATUT_OPTIONS = STATUTS_CYCLE_FORMATION_LIST;
const TYPE_OPTIONS = ["Interne", "Externe"];
const MODE_OPTIONS = ["Présentiel", "En ligne", "Hybride"];
const PARTICIPANTS_CACHE_TTL_MS = 10 * 60 * 1000;
const WARMUP_PANELS_DELAY_MS = 2800;
const WARMUP_PARTICIPANTS_DELAY_MS = 1800;

const FormationsPage = () => {
  const { setTitle, clearActions } = useHeader();
  const { dynamicStyles } = useOpen();
  const navigate = useNavigate();
  const catalogRef = useRef(null);
  const prewarmedFormationIdsRef = useRef(new Map());
  const prewarmedParticipantsIdsRef = useRef(new Map());
  const prewarmedParticipantsRequestsRef = useRef(new Map());

  const readLocalTimedCache = useCallback((key, ttlMs) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.ts !== "number") return null;
      if (Date.now() - parsed.ts > ttlMs) return null;
      return parsed.data;
    } catch {
      return null;
    }
  }, []);

  const writeLocalTimedCache = useCallback((key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
    } catch {
      // Ignore cache persistence errors.
    }
  }, []);

  /* ─── rows state (single source of truth) ─── */
  const [trainingsState, setTrainingsState] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ─── drawer state: null | "add" | "edit" | "view" ─── */
  const [drawerMode, setDrawerMode] = useState(null);
  const [selectedTraining, setSelectedTraining] = useState(null);

  /* ─── attendance sub-view: null | session object ─── */
  const [attendanceSession, setAttendanceSession] = useState(null);

  /* ─── filters toolbar ─── */
  const [filtersVisible, setFiltersVisible] = useState(false);

  /* ─── add / edit form ─── */
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  /* ─── formateur state ─── */
  const [employees, setEmployees] = useState([]);
  const [formateurOptions, setFormateurOptions] = useState([]);
  const [formateurResources, setFormateurResources] = useState([]);
  const [manageFormateurModal, setManageFormateurModal] = useState(false);
  const [selectedFormateurEmploye, setSelectedFormateurEmploye] = useState([]);
  const [selectedFormateurExterne, setSelectedFormateurExterne] = useState([]);

  /* ─── domaine state ─── */
  const [domaineOptions, setDomaineOptions] = useState([...INITIAL_DOMAINE_OPTIONS]);
  const [manageDomaineModal, setManageDomaineModal] = useState(false);

  /* ─── competences state ─── */
  const [competencesOptions, setCompetencesOptions] = useState([]);
  const [selectedCompetences, setSelectedCompetences] = useState([]);

  const isDrawerOpen = drawerMode !== null;

  const prefetchFormationPanels = useCallback(async (formation, options = {}) => {
    const { forceRefresh = false } = options;
    if (!formation?.id) return;

    const tasks = [
      prefetchFormationSessions(formation.id, {
        forceRefresh,
        knownSessionsCount: formation.sessions_count,
      }),
    ];

    const effectif = Number(formation.effectif);
    const participants = Number(formation.participants_count ?? 0);
    const isFull = Number.isFinite(effectif) && effectif > 0 && participants >= effectif;

    if (!isFull) {
      tasks.push(prefetchSmartSuggestions(formation.id, { forceRefresh }));
    }

    await Promise.allSettled(tasks);
  }, []);

  /* ─── fetch formations from API ─── */
  const fetchFormations = useCallback(async (options = {}) => {
    const { showLoader = true } = options;
    let hasCachedData = false;

    if (showLoader) {
      setLoading(true);
    }

    try {
      if (showLoader) {
        // Load from cache immediately for instant display
        const cachedData = localStorage.getItem('formations_cache');
        if (cachedData) {
          try {
            const parsed = JSON.parse(cachedData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setTrainingsState(parsed);
              setLoading(false);
              hasCachedData = true;
            }
          } catch (e) {
            console.warn('Cache invalide:', e);
          }
        }
      }

      // Fetch fresh data from API
      const res = await apiClient.get("/formations", {
        params: { include_sessions: 1 },
      });
      const freshData = res.data || [];
      setTrainingsState(freshData);
      // Cache will be updated automatically by the useEffect
    } catch (err) {
      console.error("Erreur chargement formations:", err);
      // Don't show error if we have cached data
      if (!hasCachedData) {
        Swal.fire({ icon: "error", title: "Erreur", text: "Impossible de charger les formations." });
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  /* ─── fetch employees for formateur interne ─── */
  const fetchEmployees = useCallback(async () => {
    try {
      const res = await apiClient.get("/employes/list");
      const list = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
      setEmployees(list);
    } catch (err) {
      console.error("Erreur chargement employes:", err);
      setEmployees([]);
    }
  }, []);

  /* ─── fetch formateurs externes ─── */
  const fetchFormateurs = useCallback(async () => {
    try {
      const res = await apiClient.get("/formateurs");
      const list = Array.isArray(res.data) ? res.data : [];
      setFormateurOptions(list.map((f) => ({ label: f.name, value: String(f.id) })));
      setFormateurResources(list.map((f) => ({ id: f.id, name: f.name })));
    } catch (err) {
      console.error("Erreur chargement formateurs:", err);
      setFormateurOptions([]);
      setFormateurResources([]);
    }
  }, []);

  /* ─── fetch competences for formations ─── */
  const fetchCompetences = useCallback(async () => {
    let hasCachedData = false;

    // Load from cache immediately for instant display
    try {
      const cachedData = localStorage.getItem('competences_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCompetencesOptions(parsed.map((c) => ({
            value: c.id,
            label: c.nom,
            categorie: c.categorie,
          })));
          hasCachedData = true;
        }
      }
    } catch (e) {
      console.warn('Cache compétences invalide:', e);
    }

    // Fetch fresh data from API in background
    try {
      const res = await apiClient.get("/competences");
      const list = Array.isArray(res.data) ? res.data : [];
      setCompetencesOptions(list.map((c) => ({
        value: c.id,
        label: c.nom,
        categorie: c.categorie,
      })));
      
      // Update cache
      try {
        localStorage.setItem('competences_cache', JSON.stringify(list));
      } catch (e) {
        console.warn('Erreur sauvegarde cache compétences:', e);
      }
    } catch (err) {
      console.error("Erreur chargement competences:", err);
      if (!hasCachedData) {
        setCompetencesOptions([]);
      }
    }
  }, []);

  const employeeOptions = useMemo(() =>
    employees.map((emp) => ({
      value: String(emp.id),
      label: `${emp.matricule || ""} - ${emp.nom || ""} ${emp.prenom || ""}`.trim(),
    })),
    [employees]
  );

  useEffect(() => {
    setTitle("Formations");
    loadDomaines();
    
    // Load formations first (will use cache for instant display)
    fetchFormations();
    
    // Load other data in parallel without blocking
    Promise.all([
      fetchEmployees(),
      fetchFormateurs(),
      fetchCompetences(),
    ]).catch(err => {
      console.error('Erreur chargement données auxiliaires:', err);
    });
    
    return () => clearActions();
  }, [setTitle, clearActions, fetchFormations, fetchEmployees, fetchFormateurs, fetchCompetences]);

  /* ─── Auto-update cache whenever trainingsState changes ─── */
  useEffect(() => {
    if (trainingsState.length > 0) {
      try {
        localStorage.setItem('formations_cache', JSON.stringify(trainingsState));

        const ts = Date.now();
        trainingsState.forEach((training) => {
          if (!training?.id) return;
          localStorage.setItem(
            `cf_formation_details_cache_v1:${training.id}`,
            JSON.stringify({ ts, data: training })
          );
        });
      } catch (e) {
        console.warn('Erreur mise à jour cache:', e);
      }
    }
  }, [trainingsState]);

  /* ─── Warm planning + suggestions cache for top visible formations ─── */
  useEffect(() => {
    if (!Array.isArray(trainingsState) || trainingsState.length === 0) return;

    const now = Date.now();
    const candidates = trainingsState
      .filter((training) => {
        const key = String(training?.id || "");
        if (!key) return false;
        const lastPrefetch = prewarmedFormationIdsRef.current.get(key) || 0;
        if (now - lastPrefetch < 90 * 1000) return false;
        prewarmedFormationIdsRef.current.set(key, now);
        return true;
      })
      .slice(0, 6);

    if (candidates.length === 0) return;

    let cancelled = false;
    let warmupTimer = null;

    const runWarmup = async () => {
      for (let i = 0; i < candidates.length; i += 2) {
        if (cancelled) return;
        const chunk = candidates.slice(i, i + 2);
        await Promise.allSettled(chunk.map((training) => prefetchFormationPanels(training)));
      }
    };

    warmupTimer = window.setTimeout(() => {
      runWarmup();
    }, WARMUP_PANELS_DELAY_MS);

    return () => {
      cancelled = true;
      if (warmupTimer) {
        window.clearTimeout(warmupTimer);
      }
    };
  }, [trainingsState, prefetchFormationPanels]);

  useEffect(() => {
    if (!Array.isArray(trainingsState) || trainingsState.length === 0) return;

    const now = Date.now();
    const candidates = trainingsState
      .filter((training) => {
        const id = Number(training?.id);
        if (!Number.isFinite(id) || id <= 0) return false;
        if (Number(training?.participants_count ?? 0) <= 0) return false;

        const cacheKey = `cf_formation_participants_cache_v1:${id}`;
        const cached = readLocalTimedCache(cacheKey, PARTICIPANTS_CACHE_TTL_MS);
        if (Array.isArray(cached)) return false;

        const lastPrefetch = prewarmedParticipantsIdsRef.current.get(id) || 0;
        if (now - lastPrefetch < 90 * 1000) return false;

        prewarmedParticipantsIdsRef.current.set(id, now);
        return true;
      })
      .slice(0, 4);

    if (candidates.length === 0) return;

    let cancelled = false;
    let warmupTimer = null;

    const runParticipantsWarmup = async () => {
      for (let i = 0; i < candidates.length; i += 2) {
        if (cancelled) return;
        const chunk = candidates.slice(i, i + 2);
        await Promise.allSettled(
          chunk.map(async (training) => {
            const formationId = Number(training.id);
            const response = await apiClient.get(
              `/formations/${formationId}/participants`,
              { timeout: 10000 }
            );
            const list = Array.isArray(response.data) ? response.data : [];
            writeLocalTimedCache(`cf_formation_participants_cache_v1:${formationId}`, list);
          })
        );
      }
    };

    warmupTimer = window.setTimeout(() => {
      runParticipantsWarmup();
    }, WARMUP_PARTICIPANTS_DELAY_MS);

    return () => {
      cancelled = true;
      if (warmupTimer) {
        window.clearTimeout(warmupTimer);
      }
    };
  }, [trainingsState, readLocalTimedCache, writeLocalTimedCache]);

  const prewarmParticipantsForFormation = useCallback((formationId, options = {}) => {
    const { force = false, timeout = 10000 } = options;
    const parsedId = Number(formationId);
    if (!Number.isFinite(parsedId) || parsedId <= 0) return Promise.resolve([]);

    const cacheKey = `cf_formation_participants_cache_v1:${parsedId}`;
    const cached = readLocalTimedCache(cacheKey, PARTICIPANTS_CACHE_TTL_MS);
    if (Array.isArray(cached)) return Promise.resolve(cached);

    const inFlightPromise = prewarmedParticipantsRequestsRef.current.get(parsedId);
    if (inFlightPromise) {
      return inFlightPromise;
    }

    const now = Date.now();
    const lastPrefetch = prewarmedParticipantsIdsRef.current.get(parsedId) || 0;
    if (!force && now - lastPrefetch < 15 * 1000) return Promise.resolve([]);
    prewarmedParticipantsIdsRef.current.set(parsedId, now);

    const requestPromise = apiClient
      .get(`/formations/${parsedId}/participants`, { timeout })
      .then((response) => {
        const list = Array.isArray(response.data) ? response.data : [];
        writeLocalTimedCache(cacheKey, list);
        return list;
      })
      .catch(() => {
        // silent prewarm
        return [];
      })
      .finally(() => {
        prewarmedParticipantsRequestsRef.current.delete(parsedId);
      });

    prewarmedParticipantsRequestsRef.current.set(parsedId, requestPromise);
    return requestPromise;
  }, [readLocalTimedCache, writeLocalTimedCache]);

  const navigateToParticipants = useCallback((training) => {
    if (!training?.id) return;

    const parsedId = Number(training.id);
    if (!Number.isFinite(parsedId) || parsedId <= 0) return;

    const cacheKey = `cf_formation_participants_cache_v1:${parsedId}`;
    const cachedParticipants = readLocalTimedCache(cacheKey, PARTICIPANTS_CACHE_TTL_MS);

    prewarmParticipantsForFormation(parsedId, { force: true, timeout: 8000 });

    navigate(`/carrieres-formations/formations/${parsedId}/participants`, {
      state: {
        formation: training,
        fromParticipantsLink: true,
        participants: Array.isArray(cachedParticipants) ? cachedParticipants : undefined,
      },
    });
  }, [navigate, prewarmParticipantsForFormation, readLocalTimedCache]);

  /* ─── load domaines from localStorage ─── */
  const loadDomaines = () => {
    try {
      const saved = localStorage.getItem('formation_domaines');
      if (saved) {
        const parsed = JSON.parse(saved);
        setDomaineOptions([...new Set([...INITIAL_DOMAINE_OPTIONS, ...parsed])]);
      }
    } catch (err) {
      console.error('Erreur chargement domaines:', err);
    }
  };

  /* ─── save domaines to localStorage ─── */
  const saveDomaines = (domaines) => {
    try {
      const uniqueDomaines = [...new Set(domaines)];
      localStorage.setItem('formation_domaines', JSON.stringify(uniqueDomaines));
      setDomaineOptions(uniqueDomaines);
    } catch (err) {
      console.error('Erreur sauvegarde domaines:', err);
    }
  };

  /* ─── handlers for domaines ─── */
  const handleAddDomaine = (name) => {
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    if (domaineOptions.includes(trimmed)) {
      Swal.fire({ icon: "warning", title: "Domaine existant", text: "Ce domaine existe déjà.", timer: 2000 });
      return;
    }
    const newDomaines = [...domaineOptions, trimmed];
    saveDomaines(newDomaines);
    Swal.fire({ icon: "success", title: "Ajouté", text: `Domaine "${trimmed}" ajouté.`, timer: 1500, showConfirmButton: false });
  };

  const handleEditDomaine = (oldName, newName) => {
    if (!newName || !newName.trim()) return;
    const trimmed = newName.trim();
    if (trimmed === oldName) return;
    if (domaineOptions.includes(trimmed)) {
      Swal.fire({ icon: "warning", title: "Domaine existant", text: "Ce domaine existe déjà.", timer: 2000 });
      return;
    }
    const newDomaines = domaineOptions.map((d) => (d === oldName ? trimmed : d));
    saveDomaines(newDomaines);
    // Update form if old domaine was selected
    if (formData.domaine === oldName) {
      setFormData((prev) => ({ ...prev, domaine: trimmed }));
    }
    Swal.fire({ icon: "success", title: "Modifié", text: "Domaine mis à jour.", timer: 1500, showConfirmButton: false });
  };

  const handleDeleteDomaine = (name) => {
    if (INITIAL_DOMAINE_OPTIONS.includes(name)) {
      Swal.fire({ icon: "warning", title: "Impossible", text: "Les domaines par défaut ne peuvent pas être supprimés.", timer: 2000 });
      return;
    }
    const newDomaines = domaineOptions.filter((d) => d !== name);
    saveDomaines(newDomaines);
    // Clear form if deleted domaine was selected
    if (formData.domaine === name) {
      setFormData((prev) => ({ ...prev, domaine: "" }));
    }
    Swal.fire({ icon: "success", title: "Supprimé", text: "Domaine supprimé.", timer: 1500, showConfirmButton: false });
  };

  /* ─── handlers for TrainingCatalog ─── */
  const handleViewDetails = useCallback(async (training) => {
    // Open drawer immediately with available data
    setSelectedTraining(training);
    setDrawerMode("view");
    prefetchFormationPanels(training).catch(() => {});
    
    // Fetch full formation details including competences in background
    try {
      const res = await apiClient.get(`/formations/${training.id}`);
      const fullTraining = res.data;
      setSelectedTraining(fullTraining);
      prefetchFormationPanels(fullTraining).catch(() => {});
    } catch (err) {
      console.error("Erreur chargement détails formation:", err);
    }
  }, [prefetchFormationPanels]);

  const handleAdd = useCallback(() => {
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setSelectedTraining(null);
    setSelectedFormateurEmploye([]);
    setSelectedFormateurExterne([]);
    setSelectedCompetences([]);
    setDrawerMode("add");
  }, []);

  const handleEdit = useCallback(async (training) => {
    // Open drawer immediately with available data
    setFormData({
      code: training.code || "",
      titre: training.titre || "",
      domaine: training.domaine || "",
      type: training.type || training.type_formation || "",
      mode_formation: training.mode_formation || "",
      duree: training.duree || "",
      statut: training.statut || STATUTS_CYCLE_FORMATION.PLANIFIEE,
      date_debut: training.date_debut ? training.date_debut.substring(0, 10) : "",
      date_fin: training.date_fin ? training.date_fin.substring(0, 10) : "",
      budget: training.budget || "",
      organisme: training.organisme || "",
      effectif: training.effectif || "",
      formateur_employe_id: training.formateur_employe_id ? String(training.formateur_employe_id) : "",
      formateur_id: training.formateur_id ? String(training.formateur_id) : "",
      competence_ids: training.competence_ids || [],
    });
    setFormErrors({});
    setSelectedTraining(training);
    setDrawerMode("edit");

    // Pre-select formateur dropdowns with available data
    if (training.type === "Interne" && training.formateur_employe_id) {
      const emp = employees.find((e) => String(e.id) === String(training.formateur_employe_id));
      if (emp) {
        setSelectedFormateurEmploye([{ value: String(emp.id), label: `${emp.matricule || ""} - ${emp.nom || ""} ${emp.prenom || ""}`.trim() }]);
      } else {
        setSelectedFormateurEmploye([]);
      }
      setSelectedFormateurExterne([]);
    } else if (training.type === "Externe" && training.formateur_id) {
      const fmt = formateurResources.find((f) => String(f.id) === String(training.formateur_id));
      if (fmt) {
        setSelectedFormateurExterne([{ value: String(fmt.id), label: fmt.name }]);
      } else {
        setSelectedFormateurExterne([]);
      }
      setSelectedFormateurEmploye([]);
    } else {
      setSelectedFormateurEmploye([]);
      setSelectedFormateurExterne([]);
    }
    
    // Pre-select competences dropdown with available data
    if (training.competence_ids?.length > 0) {
      const selected = competencesOptions.filter((c) => training.competence_ids.includes(c.value));
      setSelectedCompetences(selected);
    } else {
      setSelectedCompetences([]);
    }

    // Fetch full formation details in background to ensure all data is complete
    try {
      const res = await apiClient.get(`/formations/${training.id}`);
      const fullTraining = res.data;
      
      // Update form data with complete information
      setFormData({
        code: fullTraining.code || "",
        titre: fullTraining.titre || "",
        domaine: fullTraining.domaine || "",
        type: fullTraining.type || fullTraining.type_formation || "",
        mode_formation: fullTraining.mode_formation || "",
        duree: fullTraining.duree || "",
        statut: fullTraining.statut || STATUTS_CYCLE_FORMATION.PLANIFIEE,
        date_debut: fullTraining.date_debut ? fullTraining.date_debut.substring(0, 10) : "",
        date_fin: fullTraining.date_fin ? fullTraining.date_fin.substring(0, 10) : "",
        budget: fullTraining.budget || "",
        organisme: fullTraining.organisme || "",
        effectif: fullTraining.effectif || "",
        formateur_employe_id: fullTraining.formateur_employe_id ? String(fullTraining.formateur_employe_id) : "",
        formateur_id: fullTraining.formateur_id ? String(fullTraining.formateur_id) : "",
        competence_ids: fullTraining.competence_ids || [],
      });
      
      setSelectedTraining(fullTraining);
      
      // Update competences if needed
      if (fullTraining.competence_ids?.length > 0) {
        const selected = competencesOptions.filter((c) => fullTraining.competence_ids.includes(c.value));
        setSelectedCompetences(selected);
      }
    } catch (err) {
      console.error("Erreur chargement détails formation:", err);
    }
  }, [employees, formateurResources, competencesOptions]);

  const handleDelete = useCallback((training) => {
    Swal.fire({
      title: "Supprimer la formation ?",
      text: `"${training.titre}" sera definitivement supprimee.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Supprimer",
      cancelButtonText: "Annuler",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await apiClient.delete(`/formations/${training.id}`);
          setTrainingsState((prev) => prev.filter((t) => t.id !== training.id));
          if (selectedTraining?.id === training.id) setDrawerMode(null);
          Swal.fire({ icon: "success", title: "Supprimee", timer: 1200, showConfirmButton: false });
        } catch (err) {
          console.error("Erreur suppression:", err);
          Swal.fire({ icon: "error", title: "Erreur", text: "Impossible de supprimer la formation." });
        }
      }
    });
  }, [selectedTraining]);

  const handleFiltersToggle = useCallback(() => {
    setFiltersVisible((v) => !v);
  }, []);

  /** Refresh participants_count on a single formation after AI-panel adds a participant */
  const handleParticipantAdded = useCallback((formationId) => {
    setTrainingsState((prev) =>
      prev.map((t) =>
        t.id === formationId
          ? { ...t, participants_count: (t.participants_count ?? 0) + 1 }
          : t
      )
    );
    // Also keep selectedTraining in sync
    setSelectedTraining((prev) =>
      prev?.id === formationId
        ? { ...prev, participants_count: (prev.participants_count ?? 0) + 1 }
        : prev
    );
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerMode(null);
    setSelectedTraining(null);
    setAttendanceSession(null);
  }, []);

  /** Refresh selected formation after attendance changes */
  const refreshSelectedFormation = useCallback(async () => {
    if (!selectedTraining?.id) return;
    try {
      const res = await apiClient.get(`/formations/${selectedTraining.id}`);
      const updated = res.data;
      // Update in the list
      setTrainingsState((prev) =>
        prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t))
      );
      // Update selected
      setSelectedTraining(updated);
    } catch (err) {
      console.error('Erreur rafraîchissement formation:', err);
    }
  }, [selectedTraining?.id]);

  const handleAttendanceSaved = useCallback(async () => {
    await fetchFormations({ showLoader: false });
    await refreshSelectedFormation();
  }, [fetchFormations, refreshSelectedFormation]);

  /* ─── calculate end date based on duration and start date ─── */
  const calculateEndDate = (startDate, duration) => {
    if (!startDate || !duration) return "";
    
    try {
      const start = new Date(startDate);
      if (isNaN(start.getTime())) return "";
      
      // Parse duration: "3 jours", "2 semaines", "1 mois", or just "3"
      const durationStr = duration.toLowerCase().trim();
      let days = 0;
      
      // Extract number from duration
      const match = durationStr.match(/(\d+)/);
      if (!match) return "";
      
      const number = parseInt(match[1], 10);
      if (isNaN(number) || number <= 0) return "";
      
      // Determine unit (jours, semaines, mois)
      if (durationStr.includes("jour")) {
        days = number;
      } else if (durationStr.includes("semaine")) {
        days = number * 7;
      } else if (durationStr.includes("mois")) {
        days = number * 30;
      } else if (durationStr.includes("an") || durationStr.includes("année")) {
        days = number * 365;
      } else {
        // If no unit specified, treat as days
        days = number;
      }
      
      // Calculate end date (subtract 1 because start date is included)
      const end = new Date(start);
      end.setDate(end.getDate() + days - 1);
      
      // Format as YYYY-MM-DD
      const year = end.getFullYear();
      const month = String(end.getMonth() + 1).padStart(2, '0');
      const day = String(end.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (err) {
      console.error("Error calculating end date:", err);
      return "";
    }
  };

  /* ─── form field change ─── */
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      
      // Reset formateur fields when type changes
      if (name === "type") {
        next.formateur_employe_id = "";
        next.formateur_id = "";
        setSelectedFormateurEmploye([]);
        setSelectedFormateurExterne([]);
      }
      
      // Auto-calculate date_fin when date_debut or duree changes
      if (name === "date_debut" || name === "duree") {
        const startDate = name === "date_debut" ? value : prev.date_debut;
        const duration = name === "duree" ? value : prev.duree;
        
        if (startDate && duration) {
          const calculatedEndDate = calculateEndDate(startDate, duration);
          if (calculatedEndDate) {
            next.date_fin = calculatedEndDate;
          }
        }
      }
      
      return next;
    });
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.titre.trim()) errors.titre = "Titre requis";
    if (!formData.code.trim()) errors.code = "Code requis";
    if (!formData.domaine.trim()) errors.domaine = "Domaine requis";
    if (!formData.type.trim()) errors.type = "Type requis";
    if (!formData.statut.trim()) errors.statut = "Statut requis";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      ...formData,
      budget: Number(formData.budget) || 0,
      effectif: formData.effectif ? Number(formData.effectif) : null,
      formateur_employe_id: formData.type === "Interne" && formData.formateur_employe_id ? Number(formData.formateur_employe_id) : null,
      formateur_id: formData.type === "Externe" && formData.formateur_id ? Number(formData.formateur_id) : null,
      competence_ids: selectedCompetences.map((c) => c.value),
    };

    try {
      if (drawerMode === "add") {
        const res = await apiClient.post("/formations", payload);
        setTrainingsState((prev) => [res.data, ...prev]);
        Swal.fire({ icon: "success", title: "Formation ajoutee", timer: 1200, showConfirmButton: false });
        setDrawerMode(null);
      } else if (drawerMode === "edit") {
        const res = await apiClient.put(`/formations/${selectedTraining.id}`, payload);
        setTrainingsState((prev) =>
          prev.map((t) => (t.id === selectedTraining.id ? res.data : t))
        );
        Swal.fire({ icon: "success", title: "Formation modifiee", timer: 1200, showConfirmButton: false });
        setDrawerMode(null);
      }
    } catch (err) {
      console.error("Erreur sauvegarde formation:", err);
      const msg = err.response?.data?.message || "Erreur lors de la sauvegarde.";
      Swal.fire({ icon: "error", title: "Erreur", text: msg });
    }
  };

  /* ─── render drawer right panel ─── */
  const renderDrawerContent = () => {
    if (drawerMode === "add" || drawerMode === "edit") {
      return (
        <form id="formationForm" onSubmit={handleFormSubmit} noValidate>
          <div className="row g-3">
            {/* Code */}
            <div className="col-md-6">
              <label className="info-label">Code</label>
              <input
                type="text"
                className={`form-control form-control-sm ${formErrors.code ? "is-invalid" : ""}`}
                name="code"
                value={formData.code}
                onChange={handleFormChange}
                placeholder="Ex: FORM-001"
              />
              {formErrors.code && <div className="invalid-feedback">{formErrors.code}</div>}
            </div>

            {/* Titre */}
            <div className="col-md-6">
              <label className="info-label">Titre</label>
              <input
                type="text"
                className={`form-control form-control-sm ${formErrors.titre ? "is-invalid" : ""}`}
                name="titre"
                value={formData.titre}
                onChange={handleFormChange}
                placeholder="Titre de la formation"
              />
              {formErrors.titre && <div className="invalid-feedback">{formErrors.titre}</div>}
            </div>

            {/* Domaine */}
            <div className="col-md-6">
              <label className="info-label">Domaine</label>
              <div className="unified-input-group" style={{ display: 'flex', width: '100%' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <select
                    className={`form-select form-select-sm ${formErrors.domaine ? "is-invalid" : ""}`}
                    name="domaine"
                    value={formData.domaine}
                    onChange={handleFormChange}
                    style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                  >
                    <option value="">-- Choisir --</option>
                    {domaineOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {formErrors.domaine && <div className="invalid-feedback">{formErrors.domaine}</div>}
                </div>
                <button
                  type="button"
                  className="cnss-btn-add"
                  onClick={() => setManageDomaineModal(true)}
                  title="Gérer les domaines"
                  style={{ 
                    height: '31px',
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    marginLeft: '-1px'
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Type */}
            <div className="col-md-6">
              <label className="info-label">Type de formation</label>
              <select
                className={`form-select form-select-sm ${formErrors.type ? "is-invalid" : ""}`}
                name="type"
                value={formData.type}
                onChange={handleFormChange}
              >
                <option value="">-- Choisir --</option>
                {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              {formErrors.type && <div className="invalid-feedback">{formErrors.type}</div>}
            </div>

            {/* Mode de formation */}
            <div className="col-md-6">
              <label className="info-label">Mode de formation</label>
              <select
                className="form-select form-select-sm"
                name="mode_formation"
                value={formData.mode_formation}
                onChange={handleFormChange}
              >
                <option value="">-- Choisir --</option>
                {MODE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Statut */}
            <div className="col-md-6">
              <label className="info-label">Statut</label>
              <select
                className={`form-select form-select-sm ${formErrors.statut ? "is-invalid" : ""}`}
                name="statut"
                value={formData.statut}
                onChange={handleFormChange}
              >
                {STATUT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {formErrors.statut && <div className="invalid-feedback">{formErrors.statut}</div>}
            </div>

            {/* Duree */}
            <div className="col-md-6">
              <label className="info-label">Duree</label>
              <input
                type="text"
                className="form-control form-control-sm"
                name="duree"
                value={formData.duree}
                onChange={handleFormChange}
                placeholder="Ex: 3 jours, 2 semaines, 1 mois"
              />
              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                Format: "X jours", "X semaines", ou "X mois"
              </small>
            </div>

            {/* Budget */}
            <div className="col-md-6">
              <label className="info-label">Budget (MAD)</label>
              <input
                type="number"
                className="form-control form-control-sm"
                name="budget"
                value={formData.budget}
                onChange={handleFormChange}
                placeholder="Ex: 12000"
                min="0"
              />
            </div>

            {/* Date debut */}
            <div className="col-md-6">
              <label className="info-label">Date de debut</label>
              <input
                type="date"
                className="form-control form-control-sm"
                name="date_debut"
                value={formData.date_debut}
                onChange={handleFormChange}
              />
            </div>

            {/* Date fin */}
            <div className="col-md-6">
              <label className="info-label">
                Date de fin
                {formData.date_debut && formData.duree && (
                  <span 
                    style={{ 
                      marginLeft: "6px", 
                      fontSize: "0.7rem", 
                      color: "#059669",
                      backgroundColor: "#d1fae5",
                      padding: "2px 8px",
                      borderRadius: "8px",
                      fontWeight: 600
                    }}
                  >
                    ✓ Auto-calculée
                  </span>
                )}
              </label>
              <input
                type="date"
                className="form-control form-control-sm"
                name="date_fin"
                value={formData.date_fin}
                onChange={handleFormChange}
              />
            </div>

            {/* Organisme */}
            <div className="col-md-6">
              <label className="info-label">Organisme de formation</label>
              <input
                type="text"
                className="form-control form-control-sm"
                name="organisme"
                value={formData.organisme}
                onChange={handleFormChange}
                placeholder="Ex: Institut Management Maroc"
              />
            </div>

            {/* Effectif */}
            <div className="col-md-6">
              <label className="info-label">Effectif (capacité max)</label>
              <input
                type="number"
                className="form-control form-control-sm"
                name="effectif"
                value={formData.effectif}
                onChange={handleFormChange}
                placeholder="Ex: 25"
                min="1"
              />
            </div>

            {/* Compétences enseignées */}
            <div className="col-12">
              <label className="info-label">Compétences enseignées</label>
              <Select
                multi
                options={competencesOptions}
                values={selectedCompetences}
                onChange={(vals) => setSelectedCompetences(vals)}
                placeholder="Sélectionner les compétences..."
                searchable
                clearable
                className="react-dropdown-select"
                style={{ minHeight: "38px", borderRadius: "6px" }}
                labelField="label"
                valueField="value"
                noDataRenderer={() => (
                  <div style={{ padding: "10px", textAlign: "center", color: "#666" }}>Aucune compétence trouvée</div>
                )}
              />
              <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                Compétences que cette formation permet de développer (pour les suggestions intelligentes)
              </small>
            </div>

            {/* Formateur (employe) - conditional on type Interne */}
            {formData.type === "Interne" && (
              <div className="col-12">
                <label className="info-label">Formateur (employé)</label>
                <Select
                  options={employeeOptions}
                  values={selectedFormateurEmploye}
                  onChange={(vals) => {
                    setSelectedFormateurEmploye(vals.length > 0 ? [vals[0]] : []);
                    setFormData((prev) => ({
                      ...prev,
                      formateur_employe_id: vals.length > 0 ? vals[0].value : "",
                    }));
                  }}
                  placeholder="Rechercher un employé..."
                  searchable
                  clearable
                  className="react-dropdown-select"
                  style={{ minHeight: "38px", borderRadius: "6px" }}
                  noDataRenderer={() => (
                    <div style={{ padding: "10px", textAlign: "center", color: "#666" }}>Aucun employé trouvé</div>
                  )}
                />
              </div>
            )}

            {formData.type === "Externe" && (
              <div className="col-12">
                <label className="info-label">Formateur externe</label>
                <div style={{ display: "flex", gap: "0" }}>
                  <div style={{ flex: 1 }}>
                    <Select
                      options={formateurOptions}
                      values={selectedFormateurExterne}
                      onChange={(vals) => {
                        setSelectedFormateurExterne(vals.length > 0 ? [vals[0]] : []);
                        setFormData((prev) => ({
                          ...prev,
                          formateur_id: vals.length > 0 ? vals[0].value : "",
                        }));
                      }}
                      placeholder="Choisir un formateur..."
                      searchable
                      clearable
                      className="react-dropdown-select"
                      style={{ minHeight: "38px", borderRadius: "6px 0 0 6px" }}
                      noDataRenderer={() => (
                        <div style={{ padding: "10px", textAlign: "center", color: "#666" }}>Aucun formateur</div>
                      )}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setManageFormateurModal(true)}
                    title="Gérer les formateurs"
                    style={{
                      backgroundColor: "#3a8a90",
                      color: "#fff",
                      border: "none",
                      borderRadius: "0 6px 6px 0",
                      padding: "0 14px",
                      fontSize: "1.2rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >+</button>
                </div>
              </div>
            )}
          </div>
        </form>
      );
    }

    if (drawerMode === "view" && selectedTraining) {
      // ── Attendance sub-view ──
      if (attendanceSession) {
        return (
          <AttendanceView
            session={attendanceSession}
            onBack={() => setAttendanceSession(null)}
            onSaved={handleAttendanceSaved}
          />
        );
      }

      const infoRows = [
        { label: "Code", value: selectedTraining.code },
        { label: "Domaine", value: selectedTraining.domaine },
        { label: "Type", value: selectedTraining.type },
        { label: "Durée", value: selectedTraining.duree },
        { label: "Statut", value: selectedTraining.statut },
        { label: "Formateur", value: selectedTraining.formateur_nom || "—" },
        { label: "Date début", value: selectedTraining.date_debut ? new Date(selectedTraining.date_debut).toLocaleDateString("fr-FR") : "—" },
        { label: "Date fin", value: selectedTraining.date_fin ? new Date(selectedTraining.date_fin).toLocaleDateString("fr-FR") : "—" },
        { label: "Budget", value: selectedTraining.budget ? `${Number(selectedTraining.budget).toLocaleString("fr-FR")} MAD` : "—" },
        { label: "Organisme", value: selectedTraining.organisme },
        { label: "Effectif", value: selectedTraining.effectif || "—" },
      ];
      return (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", marginBottom: "24px" }}>
            {infoRows.map((r, i) => (
              <div key={i}>
                <span style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 600 }}>{r.label}</span>
                <p style={{ margin: "2px 0 0", fontSize: "0.92rem", color: "#1f2937" }}>{r.value || "—"}</p>
              </div>
            ))}
          </div>

          {/* Compétences enseignées */}
          <div style={{ marginBottom: "20px" }}>
            <span style={{ fontSize: "0.78rem", color: "#6b7280", fontWeight: 600, display: "block", marginBottom: "8px" }}>
              Compétences enseignées
            </span>
            {selectedTraining.competences?.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selectedTraining.competences.map((c) => (
                  <span
                    key={c.id}
                    style={{
                      backgroundColor: "#e0f2fe",
                      color: "#0369a1",
                      padding: "4px 12px",
                      borderRadius: "12px",
                      fontSize: "0.82rem",
                      fontWeight: 500,
                      border: "1px solid #7dd3fc",
                    }}
                  >
                    {c.nom}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af", fontStyle: "italic" }}>
                Aucune compétence assignée
              </p>
            )}
          </div>

          {selectedTraining.participants_count != null && (
            <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "16px" }}>
              <strong>{selectedTraining.participants_count}</strong>
              {selectedTraining.effectif ? ` / ${selectedTraining.effectif}` : ""} participant{selectedTraining.participants_count !== 1 ? "s" : ""} inscrit{selectedTraining.participants_count !== 1 ? "s" : ""}
              {selectedTraining.effectif && selectedTraining.participants_count >= selectedTraining.effectif && (
                <span style={{ color: "#dc2626", fontWeight: 600, marginLeft: "8px" }}>(Complet)</span>
              )}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              navigateToParticipants(selectedTraining);
            }}
            style={{
              width: "100%",
              padding: "12px 20px",
              backgroundColor: "#3a8a90",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2c767c")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3a8a90")}
          >
            <span style={{ fontSize: "1.1rem" }}>+</span>
            Gérer les participants
          </button>

          {/* Planning – Sessions */}
          <SessionsSection
            formation={selectedTraining}
            onManageAttendance={(session) => setAttendanceSession(session)}
          />

          {/* Smart Suggestions Panel */}
          <SmartSuggestionsPanel
            formation={selectedTraining}
            onParticipantAdded={handleParticipantAdded}
          />
        </div>
      );
    }

    return null;
  };

  const drawerTitle = () => {
    if (drawerMode === "add") return "Ajouter une formation";
    if (drawerMode === "edit") return `Modifier : ${selectedTraining?.titre || ""}`;
    if (drawerMode === "view") {
      if (attendanceSession) return `Présences – ${new Date(attendanceSession.date).toLocaleDateString("fr-FR")}`;
      return selectedTraining?.titre || "Formation";
    }
    return "";
  };

  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{ ...dynamicStyles, backgroundColor: "#ffffff", height: "100vh", display: "flex", flexDirection: "column" }}>
        <Box component="main" sx={{ flexGrow: 1, p: 0, mt: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div
            className="with-split-view"
            style={{
              display: "flex",
              width: "100%",
              height: "calc(100vh - 130px)",
              overflow: "hidden",
              gap: isDrawerOpen ? "10px" : "0",
              padding: "8px",
              boxSizing: "border-box",
            }}
          >
            {/* ── LEFT PANEL ── */}
            <div
              style={{
                flex: isDrawerOpen ? "0 0 55%" : "1 1 100%",
                overflowY: "auto",
                overflowX: "auto",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                padding: "0 20px",
                backgroundColor: "white",
                boxSizing: "border-box",
              }}
            >
              <TrainingCatalog
                ref={catalogRef}
                embedded
                showHeader
                onViewDetails={handleViewDetails}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onParticipantsHover={(t) => {
                  prewarmParticipantsForFormation(t.id, { timeout: 8000 });
                }}
                onParticipantsClick={(t) => {
                  navigateToParticipants(t);
                }}
                filtersVisible={filtersVisible}
                handleFiltersToggle={handleFiltersToggle}
                drawerOpen={isDrawerOpen}
                rows={trainingsState}
                onRowsChange={setTrainingsState}
                selectedRowId={selectedTraining?.id}
              />
            </div>

            {/* ── RIGHT PANEL (drawer) ── */}
            {isDrawerOpen && (
              <div
                style={{
                  flex: "0 0 45%",
                  overflowY: "auto",
                  backgroundColor: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "10px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                  position: "relative",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div
                  className="cnss-side-panel"
                  style={{
                    position: "relative",
                    top: "auto",
                    left: "auto",
                    width: "100%",
                    height: "100%",
                    boxShadow: "none",
                    borderRadius: 0,
                    zIndex: "auto",
                  }}
                >

                  {/* Header */}
                  <div className="cnss-form-header">
                    <div style={{ width: "24px" }} />
                    <h5>
                      {drawerTitle()}
                    </h5>
                    <button className="cnss-close-btn" onClick={closeDrawer} type="button" aria-label="Fermer">
                      <X size={20} />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="cnss-form-body">
                    {renderDrawerContent()}
                  </div>

                  {/* Footer — only for add / edit */}
                  {(drawerMode === "add" || drawerMode === "edit") && (
                    <div className="cnss-form-footer">
                      <button
                        type="button"
                        className="cnss-btn-secondary"
                        onClick={closeDrawer}
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        form="formationForm"
                        className="cnss-btn-primary"
                      >
                        {drawerMode === "add" ? "Ajouter" : "Enregistrer"}
                      </button>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        </Box>

        {/* ManageResourceModal for external formateurs */}
        <ManageResourceModal
          show={manageFormateurModal}
          onHide={() => setManageFormateurModal(false)}
          title="Gérer les Formateurs externes"
          items={formateurResources}
          onAdd={async (name) => {
            try {
              await apiClient.post("/formateurs", { name });
              await fetchFormateurs();
            } catch (err) {
              Swal.fire("Erreur", err.response?.data?.message || "Erreur lors de l'ajout", "error");
            }
          }}
          onEdit={async (id, name) => {
            try {
              await apiClient.put(`/formateurs/${id}`, { name });
              await fetchFormateurs();
            } catch (err) {
              Swal.fire("Erreur", err.response?.data?.message || "Erreur lors de la modification", "error");
            }
          }}
          onDelete={async (id) => {
            try {
              await apiClient.delete(`/formateurs/${id}`);
              await fetchFormateurs();
              // Clear selection if deleted formateur was selected
              setSelectedFormateurExterne((prev) => prev.filter((v) => v.value !== String(id)));
              setFormData((prev) => prev.formateur_id === String(id) ? { ...prev, formateur_id: "" } : prev);
            } catch (err) {
              Swal.fire("Erreur", err.response?.data?.message || "Erreur lors de la suppression", "error");
            }
          }}
          placeholder="Nouveau formateur..."
        />

        {/* ManageResourceModal for domaines */}
        <ManageResourceModal
          show={manageDomaineModal}
          onHide={() => setManageDomaineModal(false)}
          title="Gérer les domaines de formation"
          items={domaineOptions.map((d, idx) => ({ id: d, name: d }))}
          onAdd={handleAddDomaine}
          onEdit={(oldName, newName) => handleEditDomaine(oldName, newName)}
          onDelete={(name) => handleDeleteDomaine(name)}
          placeholder="Nouveau domaine..."
        />
      </Box>
    </ThemeProvider>
  );
};

export default FormationsPage;
