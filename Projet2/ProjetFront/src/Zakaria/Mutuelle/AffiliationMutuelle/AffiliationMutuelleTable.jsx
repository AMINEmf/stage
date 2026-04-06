import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import apiClient from "../../../services/apiClient";
import { Button, Table, Modal, Form } from "react-bootstrap";
import {
  faTrash,
  faFilePdf,
  faFileExcel,
  faSliders,
  faFilter,
  faClose,
  faIdCard,
  faEdit,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Trash2, Edit2, FileText } from "lucide-react";
import Dropdown from "react-bootstrap/Dropdown";
import {
  showSuccessMessage,
  showErrorMessage,
  showErrorFromResponse,
  showConfirmDialog,
  showInfoMessage,
  STANDARD_MESSAGES
} from "../../../utils/messageHelper";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { AnimatePresence, motion } from "framer-motion";
import { FaPlusCircle } from "react-icons/fa";

import AddAffiliationMutuelle from "./AddAffiliationMutuelle";
import ExpandRAffiliationTable from "./ExpandRAffiliationTable";
import AffiliationMutuelleFichePrint from "./AffiliationMutuelleFichePrint";
import "../../Style.css";
import { useOpen } from "../../../Acceuil/OpenProvider";

const api = apiClient;
const EMPLOYES_CACHE_TTL_MS = 10 * 60 * 1000;
const EMPLOYES_CACHE_VERSION = "v2";
const AFFILIATIONS_CACHE_TTL_MS = 10 * 60 * 1000;
const AFFILIATIONS_STALE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const API_REQUEST_TIMEOUT_MS = 45 * 1000;

const toNumericId = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getAffiliationsCacheKey = (scopeKey) =>
  `mutuelle:affiliations:v1:${scopeKey ?? "all"}`;

const readAffiliationsCache = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    // Backward compatibility with older plain-array cache format.
    if (Array.isArray(parsed)) return parsed;

    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.data) || !parsed.ts) return null;

    // Serve stale cache immediately, then refresh in background.
    if (Date.now() - parsed.ts > AFFILIATIONS_STALE_MAX_AGE_MS) return null;

    return parsed.data;
  } catch {
    return null;
  }
};

const writeAffiliationsCache = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Ignore localStorage quota/private mode errors.
  }
};

const getEmployesCacheKey = (departementId) =>
  `mutuelle:eligibles:${EMPLOYES_CACHE_VERSION}:${departementId ?? "all"}`;

const readEmployesCache = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!Array.isArray(parsed.data) || !parsed.ts) return null;
    if (Date.now() - parsed.ts > EMPLOYES_CACHE_TTL_MS) return null;

    return parsed.data;
  } catch {
    return null;
  }
};

const writeEmployesCache = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // Ignore localStorage quota/private mode errors.
  }
};

const getApiErrorMessage = (error) => {
  const status = error?.response?.status;
  const data = error?.response?.data;

  // On essaie de récupérer le message le plus précis possible
  const serverMsg =
    data?.error || // Souvent le message d'exception précis du backend
    data?.message || // Message global
    (typeof data === "string" ? data : null);

  return {
    status,
    message:
      serverMsg ||
      error?.message ||
      "Une erreur est survenue. Vérifiez la console et l'onglet Network.",
    data,
  };
};

const AffiliationMutuelleTable = forwardRef((props, ref) => {
  const {
    globalSearch,
    setIsAddingAffiliation,
    isAddingAffiliation,
    departementId,
    departementName,
    includeSubDepartments,
    departements,
    getSubDepartmentIds,
    filtersVisible,
    handleFiltersToggle,
  } = props;

  const { dynamicStyles } = useOpen();
  const { open } = useOpen();

  // --------------------------
  // VISIBILITE COLONNES (comme EmployeTable)
  // --------------------------
  const getInitialColumnVisibility = () => {
    const storedVisibility = localStorage.getItem(
      "affiliationMutuelleColumnVisibility"
    );
    return storedVisibility
      ? JSON.parse(storedVisibility)
      : {
        matricule: true,
        nom: true,
        prenom: true,
        mutuelle: true,
        regime: true,
        date_adhesion: true,
        date_resiliation: true,
        statut: true,
        ayant_droit: true,
      };
  };

  // --------------------------
  // STATE
  // --------------------------
  const [affiliationsWithDetails, setAffiliationsWithDetails] = useState([]);
  const [loadingAffiliations, setLoadingAffiliations] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [selectedAffiliation, setSelectedAffiliation] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [eligibleEmployes, setEligibleEmployes] = useState([]);

  const [selectedAffiliations, setSelectedAffiliations] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [affiliationsPerPage, setAffiliationsPerPage] = useState(10);

  const [columnVisibility, setColumnVisibility] = useState(
    getInitialColumnVisibility()
  );

  const dropdownRef = useRef(null);
  const affiliationsRequestRef = useRef(0);
  const lastLoadedAffiliationsDepartementRef = useRef(null);
  const lastAffiliationsDataRef = useRef([]);
  const eligibleEmployesRequestRef = useRef(0);
  const lastLoadedEligibleDepartementRef = useRef(null);

  useEffect(() => {
    lastAffiliationsDataRef.current = affiliationsWithDetails;
  }, [affiliationsWithDetails]);

  // Print fiche
  const [showFicheModal, setShowFicheModal] = useState(false);
  const [selectedAffiliationForPrint, setSelectedAffiliationForPrint] =
    useState(null);

  // Mutuelles filtres
  const [filtresMutuelle, setFiltresMutuelle] = useState([]);
  const [selectedMutuelleFilter, setSelectedMutuelleFilter] = useState("");

  // Filters STATE
  const [filterSearch, setFilterSearch] = useState("");
  const [filterStatut, setFilterStatut] = useState(""); // "" means all
  // Date Adhesion
  const [dateAdhesionFrom, setDateAdhesionFrom] = useState("");
  const [dateAdhesionTo, setDateAdhesionTo] = useState("");
  // Date Resiliation
  const [dateResiliationFrom, setDateResiliationFrom] = useState("");
  const [dateResiliationTo, setDateResiliationTo] = useState("");

  // Debounced Search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filterSearch);
    }, 120);
    return () => clearTimeout(handler);
  }, [filterSearch]);

  const resetFilters = () => {
    setSelectedMutuelleFilter("");
    setFilterSearch("");
    setFilterStatut("");
    setDateAdhesionFrom("");
    setDateAdhesionTo("");
    setDateResiliationFrom("");
    setDateResiliationTo("");
    setCurrentPage(0);
  };

  const normalizedDepartementId = useMemo(() => {
    const parsed = toNumericId(departementId);
    return parsed === null ? null : parsed;
  }, [departementId]);

  const scopedDepartementIds = useMemo(() => {
    if (normalizedDepartementId === null) return [];

    const rawIds = includeSubDepartments
      ? getSubDepartmentIds(departements, departementId)
      : [departementId];

    const ids = Array.isArray(rawIds) ? rawIds : [departementId];

    return Array.from(
      new Set(
        ids
          .map((id) => toNumericId(id))
          .filter((id) => id !== null)
      )
    ).sort((a, b) => a - b);
  }, [
    normalizedDepartementId,
    includeSubDepartments,
    getSubDepartmentIds,
    departements,
    departementId,
  ]);

  const scopedDepartementIdsSet = useMemo(
    () => new Set(scopedDepartementIds),
    [scopedDepartementIds]
  );

  // --------------------------
  // FETCH (mutuelles + affiliations) - table vide si pas de departement
  // --------------------------
  const fetchMutuelles = useCallback(async () => {
    try {
      const response = await api.get("/mutuelles");
      if (response.data?.success && Array.isArray(response.data.data)) {
        setFiltresMutuelle(response.data.data);
      }
    } catch (error) {
      const e = getApiErrorMessage(error);
      console.error("Erreur lors de la récupération des mutuelles:", e);
    }
  }, []);

  useEffect(() => {
    fetchMutuelles();
  }, [fetchMutuelles]);

  // Synchronise immédiatement le filtre lorsque la liste des mutuelles change ailleurs
  useEffect(() => {
    const handleMutuellesUpdated = (event) => {
      if (Array.isArray(event?.detail)) {
        setFiltresMutuelle(event.detail);
      } else {
        fetchMutuelles();
      }
    };

    window.addEventListener('mutuelles:updated', handleMutuellesUpdated);
    return () => window.removeEventListener('mutuelles:updated', handleMutuellesUpdated);
  }, [fetchMutuelles]);

  const fetchAffiliationsWithDetails = useCallback(async (showLoading = true) => {
    if (!departementId || scopedDepartementIds.length === 0) {
      lastLoadedAffiliationsDepartementRef.current = null;
      setAffiliationsWithDetails([]);
      return;
    }

    const requestScopeKey = scopedDepartementIds.join(',');

    const requestId = ++affiliationsRequestRef.current;
    const cacheKey = getAffiliationsCacheKey(requestScopeKey);
    const cachedData = readAffiliationsCache(cacheKey);

    // Si on n'a pas de filtres actifs, on montre le cache tout de suite
    const hasActiveFilters = Boolean(
      selectedMutuelleFilter ||
      filterStatut ||
      debouncedSearch ||
      dateAdhesionFrom ||
      dateAdhesionTo ||
      dateResiliationFrom ||
      dateResiliationTo
    );

    const hasInMemoryDataForSameDepartement =
      lastLoadedAffiliationsDepartementRef.current ===
        requestScopeKey &&
      Array.isArray(lastAffiliationsDataRef.current) &&
      lastAffiliationsDataRef.current.length > 0;

    const hasCacheForCurrentDepartement =
      Array.isArray(cachedData) && cachedData.length > 0;

    const hasFallbackData =
      hasCacheForCurrentDepartement || hasInMemoryDataForSameDepartement;

    if (Array.isArray(cachedData) && !hasActiveFilters) {
      setAffiliationsWithDetails(cachedData);
      lastLoadedAffiliationsDepartementRef.current =
        requestScopeKey;
      if (showLoading) showLoading = false; // On ne montre pas le loader principal si on a déjà du contenu
    } else if (
      lastLoadedAffiliationsDepartementRef.current !==
        requestScopeKey &&
      !hasCacheForCurrentDepartement
    ) {
      // Evite d'afficher les données d'un autre département pendant le chargement.
      setAffiliationsWithDetails([]);
    }

    if (showLoading) setLoadingAffiliations(true);

    try {
      const params = {
        departement_id: normalizedDepartementId || undefined,
        departement_ids: requestScopeKey,
        include_subdepartments: includeSubDepartments ? 1 : 0,
        mutuelle_id: selectedMutuelleFilter || undefined,
        statut: filterStatut || undefined,
        search: debouncedSearch || undefined,
        date_adhesion_from: dateAdhesionFrom || undefined,
        date_adhesion_to: dateAdhesionTo || undefined,
        date_resiliation_from: dateResiliationFrom || undefined,
        date_resiliation_to: dateResiliationTo || undefined,
      };

      const response = await api.get("/affiliations-mutuelle", {
        params,
        timeout: API_REQUEST_TIMEOUT_MS,
      });

      if (requestId !== affiliationsRequestRef.current) return;

      if (response.data?.success && Array.isArray(response.data.data)) {
        const data = response.data.data;
        setAffiliationsWithDetails(data);
        lastLoadedAffiliationsDepartementRef.current =
          requestScopeKey;

        // Mettre en cache seulement si pas de filtres
        if (!hasActiveFilters) {
          writeAffiliationsCache(cacheKey, data);
        }
      } else if (!hasFallbackData) {
        setAffiliationsWithDetails([]);
      }
    } catch (error) {
      if (requestId !== affiliationsRequestRef.current) return;

      const e = getApiErrorMessage(error);
      console.error("Erreur lors de la récupération des affiliations:", e);

      const cachedFallback = !hasActiveFilters
        ? readAffiliationsCache(cacheKey)
        : null;

      if (Array.isArray(cachedFallback)) {
        setAffiliationsWithDetails(cachedFallback);
        lastLoadedAffiliationsDepartementRef.current =
          requestScopeKey;
      } else if (!hasFallbackData) {
        setAffiliationsWithDetails([]);
      }
    } finally {
      if (requestId === affiliationsRequestRef.current) {
        setLoadingAffiliations(false);
      }
    }
  }, [
    departementId,
    selectedMutuelleFilter,
    filterStatut,
    debouncedSearch,
    dateAdhesionFrom,
    dateAdhesionTo,
    dateResiliationFrom,
    dateResiliationTo,
    normalizedDepartementId,
    scopedDepartementIds,
    includeSubDepartments,
  ]);

  const fetchEligibleEmployes = useCallback(async (targetDepartementId, { force = false } = {}) => {
    const normalizedTargetDepartementId = toNumericId(targetDepartementId);

    if (normalizedTargetDepartementId === null) {
      lastLoadedEligibleDepartementRef.current = null;
      setEligibleEmployes([]);
      return [];
    }

    const requestId = ++eligibleEmployesRequestRef.current;
    const cacheKey = getEmployesCacheKey(normalizedTargetDepartementId);

    if (!force) {
      const cached = readEmployesCache(cacheKey);
      if (Array.isArray(cached)) {
        setEligibleEmployes(cached);
        lastLoadedEligibleDepartementRef.current = normalizedTargetDepartementId;
        return cached;
      }
    }

    if (lastLoadedEligibleDepartementRef.current !== normalizedTargetDepartementId) {
      // Prevent showing employees from the previous department while the new one loads.
      setEligibleEmployes([]);
    }

    try {
      const response = await api.get('/employes/eligibles-mutuelle', {
        params: { departement_id: normalizedTargetDepartementId },
        timeout: API_REQUEST_TIMEOUT_MS,
      });

      if (requestId !== eligibleEmployesRequestRef.current) return [];

      let list = [];
      if (response.data?.success && Array.isArray(response.data.data)) {
        list = response.data.data;
      } else if (Array.isArray(response.data)) {
        list = response.data;
      }

      setEligibleEmployes(list);
      lastLoadedEligibleDepartementRef.current = normalizedTargetDepartementId;
      writeEmployesCache(cacheKey, list);
      return list;
    } catch (error) {
      if (requestId !== eligibleEmployesRequestRef.current) return [];

      const e = getApiErrorMessage(error);
      const isTimeout =
        error?.code === "ECONNABORTED" ||
        /timeout/i.test(String(e?.message || ""));

      if (isTimeout) {
        console.warn(
          'Délai dépassé pour la récupération des employés éligibles. Utilisation du cache local si disponible.',
          e
        );
      } else {
        console.error('Erreur lors de la récupération des employés éligibles:', e);
      }

      const cachedFallback = readEmployesCache(cacheKey);
      if (Array.isArray(cachedFallback)) {
        setEligibleEmployes(cachedFallback);
        lastLoadedEligibleDepartementRef.current = normalizedTargetDepartementId;
        return cachedFallback;
      }

      if (lastLoadedEligibleDepartementRef.current !== normalizedTargetDepartementId) {
        setEligibleEmployes([]);
      }

      return [];
    }
  }, []);

  useEffect(() => {
    if (normalizedDepartementId === null) {
      setAffiliationsWithDetails([]);
      setEligibleEmployes([]);
      setSelectedAffiliations([]);
      setExpandedRows({});
      return;
    }

    fetchAffiliationsWithDetails();
    fetchEligibleEmployes(normalizedDepartementId);
  }, [normalizedDepartementId, fetchAffiliationsWithDetails, fetchEligibleEmployes]);

  // Click outside dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Date formatter (French format) (centralized)
  const formatDate = useCallback((dateStr) => {
    if (!dateStr) return "-";
    // Check if it's already formatted (dd/mm/yyyy) or just a simple check
    if (dateStr === "N/A" || dateStr === "-") return dateStr;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("fr-FR");
  }, []);

  // --------------------------
  // COLUMNS (comme EmployeTable : allColumns -> visibleColumns)
  // --------------------------
  const allColumns = useMemo(
    () => [
      {
        key: "matricule",
        label: "Matricule",
        render: (item) => item.employe?.matricule || "N/A",
      },
      {
        key: "nom",
        label: "Nom",
        render: (item) => item.employe?.nom || "N/A",
      },
      {
        key: "prenom",
        label: "Prénom",
        render: (item) => item.employe?.prenom || "N/A",
      },
      {
        key: "mutuelle",
        label: "Assurance",
        render: (item) => item.mutuelle?.nom || "N/A",
      },
      {
        key: "regime",
        label: "Régime",
        render: (item) => item.regime?.libelle || "N/A",
      },
      {
        key: "date_adhesion",
        label: "Date Adhésion",
        render: (item) => formatDate(item.date_adhesion),
      },
      {
        key: "date_resiliation",
        label: "Date Résiliation",
        render: (item) => {
          if (!item.date_resiliation) {
            return (
              <span style={{ color: "#6b7280", fontStyle: "italic" }}>-</span>
            );
          }
          return (
            <span style={{ color: "#dc2626", fontWeight: 500 }}>
              {formatDate(item.date_resiliation)}
            </span>
          );
        },
      },
      {
        key: "statut",
        label: "Statut",
        render: (item) => (
          <span
            className={`badge ${item.statut === "ACTIVE" ? "bg-success" : "bg-danger"
              }`}
            style={{
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "0.8rem",
            }}
          >
            {item.statut === "ACTIVE" ? "Actif" : "Résilié"}
          </span>
        ),
      },
      {
        key: "ayant_droit",
        label: "Ayant Droit",
        render: (item) => {
          const nbEnfants = Number(item.employe?.nb_enfants || 0);
          const situation = (item.employe?.situation_fm || '').toString().toLowerCase();
          const isMarried = situation.includes('mar');
          const hasAyantDroit = item.ayant_droit || item.conjoint_ayant_droit || nbEnfants > 0 || isMarried;
          return (
            <span
              className={`badge ${hasAyantDroit ? "bg-primary" : "bg-secondary"}`}
              style={{
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "0.8rem",
              }}
            >
              {hasAyantDroit ? "Oui" : "Non"}
            </span>
          );
        },
      },
    ],
    [formatDate]
  );

  const visibleColumns = useMemo(() => {
    return allColumns.filter((col) => columnVisibility[col.key]);
  }, [allColumns, columnVisibility]);

  const handleColumnsChange = useCallback((columnKey) => {
    setColumnVisibility((prev) => {
      const next = { ...prev, [columnKey]: !prev[columnKey] };
      localStorage.setItem(
        "affiliationMutuelleColumnVisibility",
        JSON.stringify(next)
      );
      return next;
    });
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("affiliationMutuelleColumnVisibility");
    if (saved) {
      setColumnVisibility(JSON.parse(saved));
    } else {
      const defaults = {};
      allColumns.forEach((c) => (defaults[c.key] = true));
      setColumnVisibility(defaults);
      localStorage.setItem(
        "affiliationMutuelleColumnVisibility",
        JSON.stringify(defaults)
      );
    }
  }, [allColumns]);

  // --------------------------
  // LOGIQUE ADD/EDIT/CLOSE (copie EmployeTable)
  // --------------------------
  const warmEligibleEmployes = useCallback(() => {
    if (normalizedDepartementId === null) return;
    void fetchEligibleEmployes(normalizedDepartementId);
  }, [normalizedDepartementId, fetchEligibleEmployes]);

  const refreshEligibleEmployes = useCallback(() => {
    if (normalizedDepartementId === null) return;
    void fetchEligibleEmployes(normalizedDepartementId, { force: true });
  }, [normalizedDepartementId, fetchEligibleEmployes]);

  const handleAddNewAffiliation = useCallback(() => {
    if (!showAddForm) {
      setSelectedAffiliation(null);
      setShowAddForm(true);
      setIsAddingAffiliation(true);
      // Refresh in background so the panel opens instantly.
      warmEligibleEmployes();
    }
  }, [showAddForm, setIsAddingAffiliation, warmEligibleEmployes]);

  const handleEditAffiliation = useCallback(
    (affiliation) => {
      setSelectedAffiliation(affiliation);
      setShowAddForm(true);
      setIsAddingAffiliation(true);
    },
    [setIsAddingAffiliation]
  );


  const handleCloseForm = useCallback(() => {
    setSelectedAffiliation(null);
    setShowAddForm(false);
    setIsAddingAffiliation(false);
  }, [setIsAddingAffiliation]);

  const handleAffiliationAdded = useCallback(
    async (newAffiliation) => {
      handleCloseForm();
      // On fetch sans bloquer l'UI
      fetchAffiliationsWithDetails();
      refreshEligibleEmployes();
    },
    [handleCloseForm, fetchAffiliationsWithDetails, refreshEligibleEmployes]
  );

  const handleAffiliationUpdated = useCallback(
    async (updatedAffiliation) => {
      // ✅ Fermeture immédiate
      handleCloseForm();
      // Recharger en arrière-plan
      fetchAffiliationsWithDetails();
      refreshEligibleEmployes();
    },
    [handleCloseForm, fetchAffiliationsWithDetails, refreshEligibleEmployes]
  );

  // --------------------------
  // DELETE / RESILIER (Logique Active/Resiliée)
  // --------------------------
  const handleDeleteAffiliation = useCallback(
    async (affiliation) => {
      // Si l'argument n'est pas un objet (ex: si appelé avec un ID), on tente de retrouver l'objet
      let targetAffiliation = affiliation;
      if (typeof affiliation !== 'object') {
        targetAffiliation = affiliationsWithDetails.find(a => a.id === affiliation) || { id: affiliation, statut: 'UNKNOWN' };
      }

      // 1. Si ACTIVE => on propose la RESILIATION (PUT)
      if (targetAffiliation.statut === "ACTIVE") {
        const result = await showConfirmDialog(
          "Résilier l'affiliation ?",
          "Cette affiliation est ACTIVE. Vous devez la résilier avant de pouvoir la supprimer.",
          {
            confirmButtonColor: "#f59e0b",
            confirmButtonText: "Oui, résilier",
            cancelButtonText: "Annuler",
            input: "date",
            inputLabel: "Date de résiliation",
            inputValue: new Date().toLocaleDateString('en-CA'),
            inputAttributes: { required: true },
          }
        );

        if (result.isConfirmed && result.value) {
          try {
            await api.put(
              `/affiliations-mutuelle/${targetAffiliation.id}/resilier`,
              {
                date_resiliation: result.value,
                commentaire: "Résiliation via interface web",
              }
            );

            showSuccessMessage(
              "Résiliée !",
              "L'affiliation a été passée au statut RÉSILIÉ avec succès.",
              { timer: 2000, showConfirmButton: false }
            );

            fetchAffiliationsWithDetails();
            refreshEligibleEmployes();
          } catch (error) {
            console.error("Erreur résiliation:", error);
            const msg = error.response?.data?.message || error.response?.data?.error || "Une erreur est survenue lors de la résiliation.";
            showErrorMessage(
              `Erreur ${error.response?.status || ""}`,
              msg
            );
          }
        }
      }
      // 2. Si non active (donc RESILIÉ) => on propose la SUPPRESSION DEFINITIVE (DELETE)
      else {
        const result = await showConfirmDialog(
          "Suppression définitive ?",
          "Attention ! Cette action supprimera définitivement l'historique de cette affiliation.",
          {
            icon: "error",
            confirmButtonColor: "#dc2626",
            confirmButtonText: "Supprimer définitivement",
            cancelButtonText: "Annuler",
          }
        );

        if (result.isConfirmed) {
          try {
            await api.delete(
              `/affiliations-mutuelle/${targetAffiliation.id}`
            );

            showSuccessMessage(
              "Supprimée !",
              "L'affiliation a été supprimée de la base de données.",
              { timer: 2000, showConfirmButton: false }
            );

            fetchAffiliationsWithDetails();
            refreshEligibleEmployes();
          } catch (error) {
            console.error("Erreur suppression:", error);
            const msg = error.response?.data?.message || error.response?.data?.error || "Impossible de supprimer cette affiliation.";
            showErrorMessage(
              `Erreur ${error.response?.status || ""}`,
              msg
            );
          }
        }
      }
    },
    [fetchAffiliationsWithDetails, affiliationsWithDetails, refreshEligibleEmployes]
  );


  // --------------------------
  // SEARCH & FILTER HELPERS
  // --------------------------

  // filteredAffiliations handles:
  // 1. Department filtering (client-side safety / sub-departments)
  // 2. Global Search (top-bar search)
  // Note: Specific filters (search field, status, dates) are handled server-side
  const filteredAffiliations = useMemo(() => {
    if (scopedDepartementIds.length === 0) return [];

    let result = affiliationsWithDetails.filter((a) => {
      const employeDepartementId = toNumericId(a.employe?.departement_id);
      if (employeDepartementId !== null && scopedDepartementIdsSet.has(employeDepartementId)) {
        return true;
      }

      if (!Array.isArray(a.employe?.departements)) {
        return false;
      }

      return a.employe.departements.some((dept) => {
        const linkedDepartementId = toNumericId(dept?.id ?? dept?.departement_id);
        return linkedDepartementId !== null && scopedDepartementIdsSet.has(linkedDepartementId);
      });
    });

    const normalizedSearch = (globalSearch || "").toLowerCase().trim();
    if (normalizedSearch) {
      result = result.filter((a) => {
        const searchValues = [
          a.employe?.matricule,
          a.employe?.nom,
          a.employe?.prenom,
          a.mutuelle?.nom,
          a.regime?.libelle,
          a.date_adhesion,
          a.date_resiliation,
          a.statut,
          a.ayant_droit,
          a.commentaire,
          a.numero_adherent,
        ];
        return searchValues.some((v) =>
          v && v.toString().toLowerCase().includes(normalizedSearch)
        );
      });
    }

    return result;
  }, [
    affiliationsWithDetails,
    scopedDepartementIds,
    scopedDepartementIdsSet,
    globalSearch,
  ]);

  // Use the result of global search filtering as the final list for pagination/rendering
  const filteredAffiliationsWithFilters = useMemo(() => {
    return filteredAffiliations;
  }, [filteredAffiliations]);

  useEffect(() => {
    setCurrentPage(0);
  }, [
    departementId,
    includeSubDepartments,
    globalSearch,
    selectedMutuelleFilter,
    filterStatut,
    debouncedSearch,
    dateAdhesionFrom,
    dateAdhesionTo,
    dateResiliationFrom,
    dateResiliationTo,
  ]);

  useEffect(() => {
    if (currentPage === 0) return;

    const totalPages = Math.max(
      1,
      Math.ceil(filteredAffiliationsWithFilters.length / affiliationsPerPage)
    );
    const lastPageIndex = totalPages - 1;

    if (currentPage > lastPageIndex) {
      setCurrentPage(lastPageIndex);
    }
  }, [
    currentPage,
    affiliationsPerPage,
    filteredAffiliationsWithFilters.length,
  ]);


  // highlightText JSX (comme EmployeTable)
  const highlightText = useCallback((text, searchTerm) => {
    if (!text || !searchTerm) return text;

    const textStr = String(text);
    const searchTermLower = searchTerm.toLowerCase();

    if (!textStr.toLowerCase().includes(searchTermLower)) return textStr;

    const parts = textStr.split(new RegExp(`(${searchTerm})`, "gi"));

    return parts.map((part, i) =>
      part.toLowerCase() === searchTermLower ? (
        <mark key={i} style={{ backgroundColor: "yellow" }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, []);

  // --------------------------
  // EXPAND ROW
  // --------------------------
  const toggleRowExpansion = useCallback((id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const renderExpandedRow = useCallback(
    (affiliation) => {
      return (
        <tr key={`expanded-${affiliation.id}`}>
          <td
            colSpan={visibleColumns.length + 3}
            style={{ backgroundColor: "#f8fbfb", padding: "10px 20px 20px 60px" }}
          >
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: '8px',
                marginBottom: '8px',
                color: "#475569",
                fontSize: "0.95rem",
                fontWeight: 600,
              }}>
                <FileText size={20} />
                DÉTAILS DE L'AFFILIATION
              </div>

              <div style={{
                backgroundColor: "#ffffff",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                overflow: "hidden"
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>
                        Numéro d'adhérent
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>
                        Date d'affiliation
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>
                        Statut
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>
                        Répartition
                      </th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>
                        Observations
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '600' }}>
                        {affiliation.numero_adherent || "-"}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '600' }}>
                        {formatDate(affiliation.date_adhesion)}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '600' }}>
                        {affiliation.statut || "-"}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '600' }}>
                        Employeur: <span style={{ color: '#00afaa' }}>{affiliation.regime?.part_employeur_pct ?? "-"}%</span> |
                        Employé: <span style={{ color: '#00afaa' }}>{affiliation.regime?.part_employe_pct ?? "-"}%</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#111827', fontStyle: affiliation.commentaire ? 'normal' : 'italic' }}>
                        {affiliation.commentaire || "Aucune observation"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
      );
    },
    [visibleColumns.length, formatDate]
  );

  // --------------------------
  // ACTIONS
  // --------------------------
  const handlePrintFiche = useCallback((affiliation) => {
    // Transform the nested API structure to the flat structure expected by the PDF component
    const transformedAffiliation = {
      ...affiliation, // Keep all original properties including nested regime
      // Employee information
      matricule_employe: affiliation.employe?.matricule || 'N/A',
      nom_employe: affiliation.employe?.nom || 'N/A',
      prenom_employe: affiliation.employe?.prenom || 'N/A',

      // Mutuelle information
      nom_mutuelle: affiliation.mutuelle?.nom || 'N/A',
      numero_adherent: affiliation.numero_adherent || 'N/A',

      // Dates
      date_affiliation: affiliation.date_adhesion || affiliation.date_affiliation || new Date().toISOString(),

      // Status
      statut: affiliation.statut || 'N/A',

      // Contribution breakdown
      part_employeur: affiliation.regime?.part_employeur_pct || 0,
      part_employe: affiliation.regime?.part_employe_pct || 0,

      // Observations
      observations: affiliation.commentaire || affiliation.observations || ''
    };

    setSelectedAffiliationForPrint(transformedAffiliation);
    setShowFicheModal(true);
  }, []);

  const renderCustomActions = useCallback(
    (affiliation) => (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleEditAffiliation(affiliation);
          }}
          aria-label="Modifier"
          title="Modifier"
          style={{
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            marginRight: 10,
          }}
        >
          <FontAwesomeIcon icon={faEdit} style={{ color: "#007bff", fontSize: 14 }} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrintFiche(affiliation);
          }}
          aria-label="Fiche"
          title="Fiche"
          style={{
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            marginRight: 10,
          }}
        >
          <FontAwesomeIcon icon={faIdCard} style={{ color: "#17a2b8", fontSize: 14 }} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteAffiliation(affiliation);
          }}
          aria-label="Résilier"
          title="Résilier"
          style={{
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
          }}
        >
          <FontAwesomeIcon icon={faTrash} style={{ color: "#dc3545", fontSize: 14 }} />
        </button>
      </>
    ),
    [handleDeleteAffiliation, handleEditAffiliation, handlePrintFiche]
  );

  // --------------------------
  // SELECT / DELETE SELECTED
  // --------------------------
  const handleSelectAllChange = useCallback(() => {
    if (selectedAffiliations.length === filteredAffiliationsWithFilters.length) {
      setSelectedAffiliations([]);
    } else {
      setSelectedAffiliations(filteredAffiliationsWithFilters.map((a) => a.id));
    }
  }, [filteredAffiliationsWithFilters, selectedAffiliations]);

  const handleCheckboxChange = useCallback((id) => {
    setSelectedAffiliations((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedAffiliations.length === 0) return;

    // Récupérer les objets complets pour vérifier le statut
    const selectedObjects = selectedAffiliations.map(id =>
      affiliationsWithDetails.find(a => a.id === id)
    ).filter(Boolean);

    // Vérifier s'il y a des affiliations ACTIVE
    const hasActive = selectedObjects.some(a => a.statut === "ACTIVE");

    if (hasActive) {
      // MODE RÉSILIATION MASSIVE
      const result = await showConfirmDialog(
        "Résilier la sélection ?",
        `Vous avez sélectionné ${selectedAffiliations.length} élément(s) dont certains sont ACTIFS. Ils seront résiliés.`,
        {
          confirmButtonColor: "#f59e0b",
          confirmButtonText: "Oui, résilier tout",
          cancelButtonText: "Annuler",
          input: "date",
          inputLabel: "Date de résiliation",
          inputValue: new Date().toLocaleDateString('en-CA'),
          inputAttributes: { required: true },
        }
      );

      if (result.isConfirmed && result.value) {
        try {
          // Filtrer pour ne résilier que ceux qui sont ACTIVE
          const activeOnes = selectedObjects.filter(a => a.statut === "ACTIVE");

          if (activeOnes.length > 0) {
            await Promise.all(
              activeOnes.map((item) =>
                api.put(
                  `/affiliations-mutuelle/${item.id}/resilier`,
                  {
                    date_resiliation: result.value,
                    commentaire: "Résiliation de masse via interface web",
                  }
                )
              )
            );
            showSuccessMessage("Résiliées !", `${activeOnes.length} affiliation(s) ont été résiliées.`);
          } else {
            showInfoMessage("Info", "Aucune affiliation active n'était sélectionnée pour la résiliation.");
          }

          await fetchAffiliationsWithDetails();
          refreshEligibleEmployes();
          setSelectedAffiliations([]);

        } catch (error) {
          console.error("Erreur résiliation masse:", error);
          const msg = error.response?.data?.message || "Une erreur est survenue lors de la résiliation de masse.";
          showErrorMessage("Erreur !", msg);
        }
      }
    } else {
      // MODE SUPPRESSION MASSIVE (TOUTES SONT DÉJÀ RÉSILIÉES)
      const result = await showConfirmDialog(
        "Supprimer la sélection ?",
        `Vous allez supprimer définitivement ${selectedAffiliations.length} affiliation(s). Cette action est irréversible.`,
        {
          icon: "error",
          confirmButtonColor: "#dc2626",
          confirmButtonText: "Oui, supprimer tout",
          cancelButtonText: "Annuler",
        }
      );

      if (result.isConfirmed) {
        try {
          await Promise.all(
            selectedAffiliations.map((id) =>
              api.delete(`/affiliations-mutuelle/${id}`)
            )
          );

          await fetchAffiliationsWithDetails();
          refreshEligibleEmployes();
          setSelectedAffiliations([]);

          showSuccessMessage("Supprimées !", "Les affiliations ont été supprimées.");
        } catch (error) {
          console.error("Erreur suppression masse:", error);
          const msg = error.response?.data?.message || "Une erreur est survenue lors de la suppression de masse.";
          showErrorMessage("Erreur !", msg);
        }
      }
    }
  }, [selectedAffiliations, affiliationsWithDetails, fetchAffiliationsWithDetails, refreshEligibleEmployes]);

  // --------------------------
  // PAGINATION
  // --------------------------
  const handleChangePage = useCallback((event, newPage) => {
    setCurrentPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setAffiliationsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0);
  }, []);

  // --------------------------
  // EXPORTS (PDF/EXCEL/PRINT)
  // --------------------------
  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();

    const tableColumn = visibleColumns.map((col) => col.label);

    const tableRows = filteredAffiliationsWithFilters.map((a) =>
      visibleColumns.map((col) => {
        if (col.key === "matricule") return a.employe?.matricule || "";
        if (col.key === "nom") return a.employe?.nom || "";
        if (col.key === "prenom") return a.employe?.prenom || "";
        if (col.key === "mutuelle") return a.mutuelle?.nom || "";
        if (col.key === "regime") return a.regime?.libelle || "";
        return a[col.key] ?? "";
      })
    );

    doc.setFontSize(18);
    doc.text(`Affiliations Assurance - ${departementName || ""}`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
    });

    doc.save(
      `affiliations_mutuelle_${departementName || "departement"}_${new Date().toISOString()}.pdf`
    );
  }, [visibleColumns, filteredAffiliationsWithFilters, departementName]);

  const exportToExcel = useCallback(() => {
    const tableData = filteredAffiliationsWithFilters.map((a) => {
      const row = {};
      visibleColumns.forEach((col) => {
        if (col.key === "matricule") row[col.label] = a.employe?.matricule || "";
        else if (col.key === "nom") row[col.label] = a.employe?.nom || "";
        else if (col.key === "prenom") row[col.label] = a.employe?.prenom || "";
        else if (col.key === "mutuelle") row[col.label] = a.mutuelle?.nom || "";
        else if (col.key === "regime") row[col.label] = a.regime?.libelle || "";
        else row[col.label] = a[col.key] ?? "";
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Affiliations Assurance");
    XLSX.writeFile(
      wb,
      `affiliations_mutuelle_${departementName || "departement"}_${new Date().toISOString()}.xlsx`
    );
  }, [visibleColumns, filteredAffiliationsWithFilters, departementName]);

  const handlePrint = useCallback(() => {
    const tableColumn = visibleColumns.map((col) => col.label);

    const tableRows = filteredAffiliationsWithFilters.map((a) =>
      visibleColumns.map((col) => {
        if (col.key === "matricule") return a.employe?.matricule || "";
        if (col.key === "nom") return a.employe?.nom || "";
        if (col.key === "prenom") return a.employe?.prenom || "";
        if (col.key === "mutuelle") return a.mutuelle?.nom || "";
        if (col.key === "regime") return a.regime?.libelle || "";
        return a[col.key] ?? "";
      })
    );

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid black; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { margin-bottom: 20px; }
            @page { margin: 0; }
            body { margin: 1cm; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Affiliations Assurance dans ${departementName || ""}</h1>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>${tableColumn.map((col) => `<th>${col}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${tableRows
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${cell ?? ""}</td>`).join("")}</tr>`
        )
        .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }, [visibleColumns, filteredAffiliationsWithFilters, departementName]);

  useImperativeHandle(ref, () => ({
    exportToPDF,
    exportToExcel,
    handlePrint,
  }));

  // --------------------------
  // DROPDOWN COLONNES
  // --------------------------
  const CustomMenu = React.forwardRef(
    ({ className, "aria-labelledby": labeledBy }, menuRef) => {
      return (
        <div
          ref={menuRef}
          style={{
            padding: "10px",
            backgroundColor: "white",
            border: "1px solid #ccc",
            borderRadius: "5px",
            maxHeight: "400px",
            overflowY: "auto",
          }}
          className={className}
          aria-labelledby={labeledBy}
          onClick={(e) => e.stopPropagation()}
        >
          <Form>
            {allColumns.map((column) => (
              <Form.Check
                key={column.key}
                type="checkbox"
                id={`checkbox-${column.key}`}
                label={column.label}
                checked={!!columnVisibility[column.key]}
                onChange={() => handleColumnsChange(column.key)}
              />
            ))}
          </Form>
        </div>
      );
    }
  );

  const iconButtonStyle = {
    backgroundColor: "#f9fafb",
    border: "1px solid #ccc",
    borderRadius: "5px",
    padding: "13px 16px",
    margin: "0 0px",
    cursor: "pointer",
    transition: "background-color 0.3s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flex: "0 0 auto",
  };

  const headerRowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    overflow: "visible",
  };

  const actionsRowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: "10px",
    flexWrap: "wrap",
    flex: "1 1 auto",
    minWidth: 0,
    overflow: "visible",
  };

  // --------------------------
  // RENDER
  // --------------------------
  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        top: 0,
        height: "100%",
        width: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>
        {`
          .with-split-view .add-affiliation-sidebar {
              position: relative !important;
              top: 0 !important;
              left: 0 !important;
              right: auto !important;
              width: 100% !important;
              height: 100% !important;
              box-shadow: none !important;
              animation: none !important;
              border-radius: 0 !important;
          }
          .custom-affiliation-header {
              border-bottom: none !important;
              padding-bottom: 15px;
              margin-bottom: 25px;
          }
          .custom-affiliation-header {
              border-bottom: none !important;
              padding-bottom: 15px;
              margin-bottom: 25px;
          }
          .custom-affiliation-title {
              color: #3a8a90;
              font-weight: 700;
              font-size: 1.25rem;
              display: flex;
              align-items: center;
          }
          .title-dot {
              width: 10px;
              height: 10px;
              background-color: #3a8a90;
              border-radius: 50%;
              margin-right: 12px;
              display: inline-block;
          }
          .custom-affiliation-desc {
              color: #6c757d;
              font-size: 0.9rem;
              margin-bottom: 0;
          }
        `}
      </style>
      <div style={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        // Suppression du transition: all qui créait des conflits
      }}>
        {/* Colonne Centrale: Tableau (Toujours flex: 1 pour remplir l'espace fluide) */}
        <div style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          height: '100%',
          backgroundColor: '#fff',
          boxShadow: '0 6px 20px rgba(8, 179, 173, 0.08), 0 2px 6px rgba(8, 179, 173, 0.04)',
          border: '1px solid rgba(8, 179, 173, 0.08)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          position: 'relative',
          zIndex: 1
        }}
        >
          {/* Header Moved Here */}
          <div className="mt-1">
            <div className="custom-affiliation-header mb-3">
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', columnGap: '16px', width: '100%' }}>
                {/* Bloc titre */}
                <div style={{ flex: "1 1 300px", minWidth: 0 }}>
                  <span
                    className="custom-affiliation-title mb-1"
                  >
                    <span className="title-dot"></span>
                    Affiliations Assurance
                  </span>

                  <p className="custom-affiliation-desc mb-0">
                    <>
                      {departementId ? affiliationsWithDetails.length : 0}{" "}
                      affiliation
                      {affiliationsWithDetails.length !== 1 ? "s" : ""}{" "}
                      actuellement affichée
                      {affiliationsWithDetails.length !== 1 ? "s" : ""}
                      {loadingAffiliations && affiliationsWithDetails.length > 0
                        ? " (mise a jour...)"
                        : ""}
                    </>
                  </p>
                </div>

                {/* Bloc actions */}
                <div style={{ display: "flex", gap: "10px", alignItems: 'center', justifySelf: 'end' }}>
                  <FontAwesomeIcon
                    onClick={() =>
                      handleFiltersToggle && handleFiltersToggle(!filtersVisible)
                    }
                    icon={filtersVisible ? faClose : faFilter}
                    color={filtersVisible ? "green" : ""}
                    style={{
                      cursor: "pointer",
                      fontSize: "1.9rem",
                      color: "#2c767c",
                      marginTop: "1.3%",
                      marginRight: "8px",
                    }}
                  />

                    <Button
                    onClick={() => {
                      if (!departementId) return;
                      handleAddNewAffiliation();
                    }}
                    className={`btn btn-outline-primary d-flex align-items-center ${!departementId ? "disabled-btn" : ""
                      }`}
                    size="sm"
                    style={{
                      width: "190px",
                      flex: "0 0 auto",
                      whiteSpace: "nowrap",
                      backgroundColor: "#2c767c",
                      borderColor: "#2c767c",
                      color: "white",
                      transition: "all 0.2s ease"
                    }}
                      onMouseEnter={(e) => {
                        if (departementId) {
                          warmEligibleEmployes();
                        }
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                      e.currentTarget.style.backgroundColor = '#2c767c';
                      e.currentTarget.style.borderColor = '#2c767c';
                    }}
                      onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                      onFocus={() => {
                        if (departementId) {
                          warmEligibleEmployes();
                        }
                      }}
                  >
                    <FaPlusCircle className="me-2" />
                    Ajouter Affiliation
                  </Button>

                  <Dropdown
                    show={showDropdown}
                    onToggle={(isOpen) => setShowDropdown(isOpen)}
                  >
                    <Dropdown.Toggle
                      as="button"
                      id="dropdown-visibility"
                      title="Visibilité Colonnes"
                      style={iconButtonStyle}
                    >
                      <FontAwesomeIcon
                        icon={faSliders}
                        style={{ width: 18, height: 18, color: "#4b5563" }}
                      />
                    </Dropdown.Toggle>
                    <Dropdown.Menu as={CustomMenu} />
                  </Dropdown>
                </div>
              </div>
            </div>
          </div>
          {/* Section filtres */}
          <AnimatePresence>
            {filtersVisible && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="filters-container aff-filters"
              >
                <div className="filters-row">
                  <div className="filters-icon-section">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#4a90a4"
                      strokeWidth="2"
                      className="filters-icon"
                    >
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                    <span className="filters-title">Filtres</span>
                  </div>

                  {/* FILTER: MUTUELLE */}
                  <div className="filter-group">
                    <label className="filter-label" style={{ fontSize: "0.9rem", marginRight: "6px", fontWeight: 600, color: "#2c3e50" }}>
                      Assurance
                    </label>
                    <select
                      value={selectedMutuelleFilter}
                      onChange={(e) => setSelectedMutuelleFilter(e.target.value)}
                      className="filter-input"
                      style={{ minWidth: 120, height: 30, fontSize: "0.9rem", padding: "2px 6px", borderRadius: 6 }}
                    >
                      <option value="">Toutes</option>
                      {filtresMutuelle.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* FILTER: STATUT */}
                  <div className="filter-group">
                    <label className="filter-label" style={{ fontSize: "0.9rem", marginRight: "6px", fontWeight: 600, color: "#2c3e50" }}>
                      Statut
                    </label>
                    <select
                      value={filterStatut}
                      onChange={(e) => {
                        setFilterStatut(e.target.value);
                        setCurrentPage(0);
                      }}
                      className="filter-input"
                      style={{ minWidth: 100, height: 30, fontSize: "0.9rem", padding: "2px 6px", borderRadius: 6 }}
                    >
                      <option value="">Tous</option>
                      <option value="ACTIVE">Active</option>
                      <option value="RESILIE">Résilié</option>
                    </select>
                  </div>

                  {/* FILTER: DATE ADHESION */}
                  <div className="filter-group">
                    <label className="filter-label" style={{ fontSize: "0.9rem", marginRight: "6px", fontWeight: 600, color: "#2c3e50" }}>
                      Date Adhésion
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <input type="date" value={dateAdhesionFrom} onChange={(e) => setDateAdhesionFrom(e.target.value)}
                        className="filter-input" style={{ width: 110, height: 30, fontSize: "0.85rem", padding: "2px", borderRadius: 6 }} />
                      <span style={{ fontSize: "0.9rem", color: "#666" }}>-</span>
                      <input type="date" value={dateAdhesionTo} onChange={(e) => setDateAdhesionTo(e.target.value)}
                        className="filter-input" style={{ width: 110, height: 30, fontSize: "0.85rem", padding: "2px", borderRadius: 6 }} />
                    </div>
                  </div>

                  {/* FILTER: DATE RESILIATION */}
                  <div className="filter-group">
                    <label className="filter-label" style={{ fontSize: "0.9rem", marginRight: "6px", fontWeight: 600, color: "#2c3e50" }}>
                      Date Résiliation
                    </label>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <input type="date" value={dateResiliationFrom} onChange={(e) => setDateResiliationFrom(e.target.value)}
                        className="filter-input" style={{ width: 110, height: 30, fontSize: "0.85rem", padding: "2px", borderRadius: 6 }} />
                      <span style={{ fontSize: "0.9rem", color: "#666" }}>-</span>
                      <input type="date" value={dateResiliationTo} onChange={(e) => setDateResiliationTo(e.target.value)}
                        className="filter-input" style={{ width: 110, height: 30, fontSize: "0.85rem", padding: "2px", borderRadius: 6 }} />
                    </div>
                  </div>

                </div>

              </motion.div>
            )}
          </AnimatePresence>

          {/* TABLE SCROLLABLE AREA */}
          <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
            <ExpandRAffiliationTable
              columns={visibleColumns}
              data={filteredAffiliationsWithFilters}
              searchTerm={(globalSearch || "").toLowerCase()}
              highlightText={highlightText}
              selectAll={
                selectedAffiliations.length === filteredAffiliationsWithFilters.length &&
                filteredAffiliationsWithFilters.length > 0
              }
              selectedItems={selectedAffiliations}
              handleSelectAllChange={handleSelectAllChange}
              handleCheckboxChange={handleCheckboxChange}
              handleEdit={handleEditAffiliation}
              handleDelete={handleDeleteAffiliation}
              handleDeleteSelected={handleDeleteSelected}
              rowsPerPage={affiliationsPerPage}
              page={currentPage}
              handleChangePage={handleChangePage}
              handleChangeRowsPerPage={handleChangeRowsPerPage}
              expandedRows={expandedRows}
              toggleRowExpansion={toggleRowExpansion}
              renderExpandedRow={renderExpandedRow}
              renderCustomActions={renderCustomActions}
              stickyActions
            />
          </div>
        </div>

        {/* Colonne Droite: Formulaire (Largeur animée pour un décalage fluide du tableau) */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '45%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
              style={{
                overflow: 'hidden',
                height: '100%',
                backgroundColor: '#fff',
                boxShadow: '0 6px 20px rgba(8, 179, 173, 0.08), 0 2px 6px rgba(8, 179, 173, 0.04)',
                border: '1px solid rgba(8, 179, 173, 0.08)',
                borderRadius: '12px',
                zIndex: 10,
                marginLeft: '15px' // Le gap est ici, animé par la largeur du parent
              }}
            >
              <div style={{ width: '100%', minWidth: '450px', height: '100%' }}>
                <AddAffiliationMutuelle
                  toggleAffiliationForm={handleCloseForm}
                  selectedDepartementId={departementId}
                  preloadedEmployes={eligibleEmployes}
                  onAffiliationAdded={handleAffiliationAdded}
                  selectedAffiliation={selectedAffiliation}
                  onAffiliationUpdated={handleAffiliationUpdated}
                  fetchAffiliations={fetchAffiliationsWithDetails}
                  isSidebar={true}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AffiliationMutuelleFichePrint
        show={showFicheModal}
        onHide={() => {
          setShowFicheModal(false);
          setSelectedAffiliationForPrint(null);
        }}
        affiliation={selectedAffiliationForPrint}
      />
    </div>
  );
});

export default AffiliationMutuelleTable;
