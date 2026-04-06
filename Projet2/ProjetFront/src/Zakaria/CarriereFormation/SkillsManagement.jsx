import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Box, ThemeProvider, createTheme } from "@mui/material";
import { Button, Form } from "react-bootstrap";
import { faSliders, faFilter, faClose } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Dropdown from "react-bootstrap/Dropdown";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import ExpandRTable from "../Employe/ExpandRTable";
import { useHeader } from "../../Acceuil/HeaderContext";
import { useOpen } from "../../Acceuil/OpenProvider";
import SectionTitle from "../CNSS/SectionTitle";
import apiClient from "../../services/apiClient";
import "../Style.css";
import "./CareerTraining.css";

const DEBUG_COMPETENCES = false;
const UNCATEGORIZED_LABEL = "Non classée";
const EMPLOYEE_COMPETENCES_CACHE_KEY = "cf_employee_competences_cache_v1";
const EMPLOYEE_COMPETENCES_CACHE_TTL_MS = 2 * 60 * 1000;
const PREFETCH_COMPETENCES_LIMIT = 24;
const PREFETCH_COMPETENCES_BATCH = 4;
const GLOBAL_COMPETENCE_REQUESTS_KEY = "__cf_competence_prefetch_requests";

const getSharedRequestMap = (key) => {
  if (typeof window === "undefined") return null;
  const globalObj = window;
  if (!(globalObj[key] instanceof Map)) {
    globalObj[key] = new Map();
  }
  return globalObj[key];
};

const normalizeValue = (value) => (value == null ? "" : String(value).toLowerCase().trim());

const sanitizeCompetenceRows = (rows) => (Array.isArray(rows) ? rows : []);

const buildEmployeeCompetenceSnapshot = (rowsInput) => {
  const rows = sanitizeCompetenceRows(rowsInput);
  const levels = {};
  const ids = [];

  rows.forEach((comp) => {
    const compId = comp?.id ?? comp?.competence_id;
    if (compId == null) return;
    const key = String(compId);
    const level =
      comp?.niveau ??
      comp?.pivot?.niveau ??
      comp?.pivot?.niveau_acquis ??
      0;
    levels[key] = Number(level) || 0;
    ids.push(key);
  });

  return {
    rows,
    levels,
    ids: Array.from(new Set(ids)),
  };
};

const readEmployeeCompetencesStore = () => {
  try {
    const raw = localStorage.getItem(EMPLOYEE_COMPETENCES_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const getEmployeeCompetencesCachedSnapshot = (employeeId) => {
  const store = readEmployeeCompetencesStore();
  const entry = store[String(employeeId)];

  if (!entry || !Array.isArray(entry.rows)) return null;

  const snapshot = buildEmployeeCompetenceSnapshot(entry.rows);
  const ts = Number(entry.ts) || 0;

  return {
    ...snapshot,
    ts,
    isFresh: ts > 0 && Date.now() - ts <= EMPLOYEE_COMPETENCES_CACHE_TTL_MS,
  };
};

const persistEmployeeCompetencesSnapshot = (employeeId, rows) => {
  try {
    const store = readEmployeeCompetencesStore();
    store[String(employeeId)] = {
      ts: Date.now(),
      rows: sanitizeCompetenceRows(rows),
    };
    localStorage.setItem(EMPLOYEE_COMPETENCES_CACHE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn("Erreur sauvegarde cache compétences employé:", e);
  }
};

const SkillsManagement = ({
  embedded = false,
  showHeader = true,
  departementId = null,
  departements = [],
  includeSubDepartments = false,
  preSelectedEmployeeId = null,
  preSelectedEmployee = null,
}) => {
  const { setTitle, clearActions, searchQuery } = useHeader();
  const { dynamicStyles } = useOpen();

  const [employees, setEmployees] = useState([]);
  const [competenceCatalog, setCompetenceCatalog] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("Tous");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState("add");
  const [editingRow, setEditingRow] = useState(null);
  const [formState, setFormState] = useState({
    competenceId: "",
    niveau: "",
  });
  const [employeeCompetences, setEmployeeCompetences] = useState({});
  const [employeeCompetenceIds, setEmployeeCompetenceIds] = useState(new Set());
  const [employeeCompetenceRows, setEmployeeCompetenceRows] = useState([]);
  const [loadingEmployeeCompetences, setLoadingEmployeeCompetences] = useState(false);
  const [requiredLevelsByCompetenceId, setRequiredLevelsByCompetenceId] = useState({});
  const [loadingRequiredLevels, setLoadingRequiredLevels] = useState(false);
  const [showRequiredOnly, setShowRequiredOnly] = useState(false);

  const dropdownRef = useRef(null);
  const employeeCompetencesCacheRef = useRef(new Map());
  const employeeCompetenceRequestsRef = useRef(new Map());
  const posteRequiredLevelsCacheRef = useRef(new Map());

  useEffect(() => {
    if (embedded) return;
    setTitle("Gestion des competences");
    return () => {
      clearActions();
    };
  }, [setTitle, clearActions, embedded]);

  const allColumns = useMemo(
    () => [
      { 
        key: "nom", 
        label: "Compétence",
        render: (item) => (
          <span style={{ whiteSpace: "nowrap", display: "block", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }} title={item.nom}>
            {item.nom || "—"}
          </span>
        )
      },
      { 
        key: "categorie", 
        label: "Catégorie",
        render: (item) => (
          <span style={{ whiteSpace: "nowrap", display: "block", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "150px" }} title={item.categorie}>
            {item.categorie || "—"}
          </span>
        )
      },
      { 
        key: "description", 
        label: "Description",
        render: (item) => (
          <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "250px" }} title={item.description}>
            {item.description || "—"}
          </span>
        )
      },
      { 
        key: "niveau", 
        label: "Niveau Employé",
        render: (item) => (
          <span 
            style={{ 
              fontSize: "0.85rem", 
              fontWeight: 600, 
              padding: "4px 12px", 
              borderRadius: "12px",
              backgroundColor: item.niveau >= 3 ? "#dcfce7" : item.niveau >= 2 ? "#fef3c7" : "#fee2e2",
              color: item.niveau >= 3 ? "#166534" : item.niveau >= 2 ? "#92400e" : "#991b1b",
              display: "inline-block",
              whiteSpace: "nowrap"
            }}
          >
            {item.niveau}/5
          </span>
        )
      },
      { 
        key: "niveau_requis", 
        label: (
          <span title="Niveau requis pour le poste actuel de l'employé. Défini dans 'Gestion des Postes > Ajouter/Modifier un poste > Compétences requises'">
            Niveau Requis <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>ⓘ</span>
          </span>
        ),
        render: (item) => {
          const required = item.niveau_requis || 0;
          if (required === 0) {
            return (
              <span 
                style={{ 
                  fontSize: "0.85rem", 
                  color: "#94a3b8", 
                  fontStyle: "italic",
                  whiteSpace: "nowrap"
                }}
                title="Aucun niveau requis défini pour ce poste"
              >
                non requis
              </span>
            );
          }
          const isMatch = item.niveau >= required;
          return (
            <span 
              style={{ 
                fontSize: "0.85rem", 
                fontWeight: 600, 
                padding: "4px 12px", 
                borderRadius: "12px",
                backgroundColor: isMatch ? "#dcfce7" : "#fee2e2",
                color: isMatch ? "#166534" : "#991b1b",
                display: "inline-block",
                whiteSpace: "nowrap",
                verticalAlign: "middle"
              }}
              title={isMatch ? "L'employé possède le niveau requis" : "L'employé ne possède pas le niveau requis"}
            >
              {required}/5 {isMatch ? "✓" : "✗"}
            </span>
          );
        }
      },
    ],
    []
  );

  useEffect(() => {
    const savedVisibility = localStorage.getItem("competencesColumnVisibility");
    if (savedVisibility) {
      const parsed = JSON.parse(savedVisibility);
      const merged = { ...parsed };
      allColumns.forEach((col) => {
        if (merged[col.key] === undefined) merged[col.key] = true;
      });
      setColumnVisibility(merged);
      localStorage.setItem("competencesColumnVisibility", JSON.stringify(merged));
    } else {
      const defaultVisibility = {};
      allColumns.forEach((col) => {
        defaultVisibility[col.key] = true;
      });
      setColumnVisibility(defaultVisibility);
      localStorage.setItem("competencesColumnVisibility", JSON.stringify(defaultVisibility));
    }
  }, [allColumns]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [embedded]);

  const findDepartmentById = useCallback((list, id) => {
    for (let dept of list) {
      if (dept.id === id) return dept;
      if (dept.children && dept.children.length > 0) {
        const found = findDepartmentById(dept.children, id);
        if (found) return found;
      }
    }
    return null;
  }, [embedded]);

  const departmentIdSet = useMemo(() => {
    if (!departementId) return new Set();
    const ids = [];
    const addIds = (dept) => {
      if (!dept) return;
      ids.push(dept.id);
      if (includeSubDepartments && dept.children && dept.children.length > 0) {
        dept.children.forEach(addIds);
      }
    };
    const target = findDepartmentById(departements, departementId);
    addIds(target);
    return new Set(ids.map((id) => String(id)));
  }, [departementId, departements, includeSubDepartments, findDepartmentById]);

  // Fermer le drawer et réinitialiser la sélection lors du changement de département
  useEffect(() => {
    setDrawerOpen(false);
    setDrawerMode("add");
    setEditingRow(null);
    setSelectedEmployeeId(null);
  }, [departementId]);

  const fetchEmployees = useCallback(async () => {
    let hasCachedData = false;

    // Load from cache immediately for instant display
    try {
      const cachedData = localStorage.getItem('employees_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped = parsed.map((employee) => ({
            ...employee,
            full_name: employee.full_name || `${employee.nom ?? ""} ${employee.prenom ?? ""}`.trim(),
            departement_id:
              employee.departement_id ??
              employee.unite_id ??
              employee.departement?.id ??
              (Array.isArray(employee.departements) ? employee.departements[0]?.id : null),
            unite_id: employee.unite_id ?? employee.departement_id ?? null,
            departement_nom:
              employee.departement?.nom ??
              (Array.isArray(employee.departements) ? employee.departements[0]?.nom : ""),
          }));
          setEmployees(mapped);
          hasCachedData = true;
          if (DEBUG_COMPETENCES) console.log("[SkillsManagement] Employees loaded from cache");
        }
      }
    } catch (e) {
      console.warn('Cache employés invalide:', e);
    }

    if (embedded && hasCachedData) {
      return;
    }

    // Fetch fresh data from API in background
    try {
      const response = await apiClient.get("/employes/list");
      if (DEBUG_COMPETENCES) {
        console.log("EMPLOYEES_RESPONSE", response?.data);
      }
      const payload = response?.data?.data ?? response?.data ?? [];
      const rows = Array.isArray(payload) ? payload : [];
      const mapped = rows.map((employee) => ({
        ...employee,
        full_name: employee.full_name || `${employee.nom ?? ""} ${employee.prenom ?? ""}`.trim(),
        departement_id:
          employee.departement_id ??
          employee.unite_id ??
          employee.departement?.id ??
          (Array.isArray(employee.departements) ? employee.departements[0]?.id : null),
        unite_id: employee.unite_id ?? employee.departement_id ?? null,
        departement_nom:
          employee.departement?.nom ??
          (Array.isArray(employee.departements) ? employee.departements[0]?.nom : ""),
      }));
      setEmployees(mapped);
      
      // Update cache
      try {
        localStorage.setItem('employees_cache', JSON.stringify(rows));
      } catch (e) {
        console.warn('Erreur sauvegarde cache employés:', e);
      }
    } catch (error) {
      console.error("EMPLOYEES_API_ERROR", error);
      if (!hasCachedData) {
        setEmployees([]);
      }
    }
  }, []);

  const fetchCompetenceCatalog = useCallback(async () => {
    let hasCachedData = false;

    // Load from cache immediately for instant display
    try {
      const cachedData = localStorage.getItem('competences_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCompetenceCatalog(parsed);
          setLoading(false);
          hasCachedData = true;
          if (DEBUG_COMPETENCES) console.log("[SkillsManagement] Competences loaded from cache");
        }
      }
    } catch (e) {
      console.warn('Cache compétences invalide:', e);
    }

    if (embedded && hasCachedData) {
      return;
    }

    // Fetch fresh data from API in background
    setLoading(true);
    try {
      const response = await apiClient.get("/competences");
      const payload = response?.data?.data ?? response?.data ?? [];
      const data = Array.isArray(payload) ? payload : [];
      setCompetenceCatalog(data);
      
      // Update cache
      try {
        localStorage.setItem('competences_cache', JSON.stringify(data));
      } catch (e) {
        console.warn('Erreur sauvegarde cache compétences:', e);
      }
    } catch (error) {
      console.error("COMPETENCES_CATALOG_ERROR", error);
      if (!hasCachedData) {
        setCompetenceCatalog([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployeeCompetences = useCallback(async (employeeId, options = {}) => {
    if (!employeeId) return;

    const { forceRefresh = false, silent = false } = options;
    const cacheKey = String(employeeId);
    const sharedRequests = getSharedRequestMap(GLOBAL_COMPETENCE_REQUESTS_KEY);

    let cached = employeeCompetencesCacheRef.current.get(cacheKey);
    if (!cached) {
      const diskCached = getEmployeeCompetencesCachedSnapshot(cacheKey);
      if (diskCached) {
        cached = diskCached;
        employeeCompetencesCacheRef.current.set(cacheKey, diskCached);
      }
    }

    if (cached) {
      setEmployeeCompetences(cached.levels);
      setEmployeeCompetenceIds(new Set(cached.ids));
      setEmployeeCompetenceRows(cached.rows);
    }

    const isCacheFresh = Boolean(cached?.ts) && Date.now() - Number(cached.ts) <= EMPLOYEE_COMPETENCES_CACHE_TTL_MS;

    if (!forceRefresh && isCacheFresh) {
      return;
    }

    const sharedExistingRequest = sharedRequests?.get(cacheKey);
    if (sharedExistingRequest) {
      await sharedExistingRequest;
      const refreshed = getEmployeeCompetencesCachedSnapshot(cacheKey);
      if (refreshed) {
        setEmployeeCompetences(refreshed.levels);
        setEmployeeCompetenceIds(new Set(refreshed.ids));
        setEmployeeCompetenceRows(refreshed.rows);
        employeeCompetencesCacheRef.current.set(cacheKey, refreshed);
      }
      return;
    }

    const existingRequest = employeeCompetenceRequestsRef.current.get(cacheKey);
    if (existingRequest) {
      await existingRequest;
      return;
    }

    const shouldBlockUI = !silent && !cached;
    if (shouldBlockUI) {
      setLoadingEmployeeCompetences(true);
    }

    const request = apiClient
      .get(`/employes/${employeeId}/competences`)
      .then((response) => {
        const payload = response?.data?.data ?? response?.data ?? [];
        const rows = Array.isArray(payload) ? payload : [];
        const snapshot = {
          ...buildEmployeeCompetenceSnapshot(rows),
          ts: Date.now(),
          isFresh: true,
        };

        setEmployeeCompetences(snapshot.levels);
        setEmployeeCompetenceIds(new Set(snapshot.ids));
        setEmployeeCompetenceRows(snapshot.rows);
        employeeCompetencesCacheRef.current.set(cacheKey, snapshot);
        persistEmployeeCompetencesSnapshot(cacheKey, snapshot.rows);
      })
      .catch((error) => {
        console.error("EMPLOYEE_COMPETENCES_ERROR", error);
        if (!cached) {
          setEmployeeCompetences({});
          setEmployeeCompetenceIds(new Set());
          setEmployeeCompetenceRows([]);
        }
      })
      .finally(() => {
        employeeCompetenceRequestsRef.current.delete(cacheKey);
        sharedRequests?.delete(cacheKey);
        if (shouldBlockUI) {
          setLoadingEmployeeCompetences(false);
        }
      });

    employeeCompetenceRequestsRef.current.set(cacheKey, request);
    sharedRequests?.set(cacheKey, request);
    await request;
  }, []);

  const fetchPosteRequiredLevels = useCallback(async (posteId) => {
    if (!posteId) return;

    const cacheKey = String(posteId);
    const cached = posteRequiredLevelsCacheRef.current.get(cacheKey);
    if (cached) {
      setRequiredLevelsByCompetenceId(cached);
    }

    setLoadingRequiredLevels(true);
    try {
      const response = await apiClient.get(`/postes/${posteId}/competences`);
      const payload = response?.data?.data ?? response?.data ?? [];
      const rows = Array.isArray(payload) ? payload : [];
      const levels = {};
      rows.forEach((comp) => {
        const compId = comp?.competence_id ?? comp?.id;
        if (!compId) return;
        levels[String(compId)] = Number(comp?.niveau_requis ?? comp?.pivot?.niveau_requis ?? 0) || 0;
      });
      setRequiredLevelsByCompetenceId(levels);
      posteRequiredLevelsCacheRef.current.set(cacheKey, levels);
    } catch (error) {
      console.error("POSTE_COMPETENCES_REQUIRED_ERROR", error);
      if (!cached) {
        setRequiredLevelsByCompetenceId({});
      }
    } finally {
      setLoadingRequiredLevels(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
    fetchCompetenceCatalog();
  }, [fetchEmployees, fetchCompetenceCatalog]);

  useEffect(() => {
    if (selectedEmployeeId) {
      fetchEmployeeCompetences(selectedEmployeeId);
      setShowRequiredOnly(false); // Réinitialiser le filtre lors du changement d'employé
    } else {
      setEmployeeCompetences({});
      setEmployeeCompetenceIds(new Set());
      setEmployeeCompetenceRows([]);
      setShowRequiredOnly(false);
    }
  }, [selectedEmployeeId, fetchEmployeeCompetences]);

  const selectedEmployee = useMemo(() => {
    // Essayer de trouver l'employé dans la liste locale
    const foundEmployee = employees.find((emp) => String(emp.id) === String(selectedEmployeeId));
    
    // Si trouvé, utiliser celui-ci
    if (foundEmployee) return foundEmployee;
    
    // Sinon, si un employé est pré-sélectionné depuis le parent ET son ID correspond, utiliser celui-ci
    if (preSelectedEmployee && String(preSelectedEmployee.id) === String(selectedEmployeeId)) {
      return preSelectedEmployee;
    }
    
    return null;
  }, [employees, selectedEmployeeId, preSelectedEmployee]);

  useEffect(() => {
    if (!selectedEmployee) {
      setRequiredLevelsByCompetenceId({});
      setLoadingRequiredLevels(false);
      return;
    }
    const posteId =
      selectedEmployee.poste_id ??
      selectedEmployee.posteId ??
      selectedEmployee.poste?.id ??
      null;
    if (!posteId) {
      setRequiredLevelsByCompetenceId({});
      if (!selectedEmployeeId) return;
      let isMounted = true;
      apiClient
        .get(`/employes/${selectedEmployeeId}`)
        .then((response) => {
          if (!isMounted) return;
          const emp = response?.data ?? {};
          const fallbackPosteId =
            emp.poste_id ??
            emp.posteId ??
            emp.poste?.id ??
            null;
          if (fallbackPosteId) {
            fetchPosteRequiredLevels(fallbackPosteId);
          }
        })
        .catch(() => {
          // ignore
        });
      return () => {
        isMounted = false;
      };
    }
    fetchPosteRequiredLevels(posteId);
  }, [selectedEmployee, selectedEmployeeId, fetchPosteRequiredLevels]);

  useEffect(() => {
    const refreshRequiredLevels = () => {
      if (!selectedEmployee) return;
      const posteId =
        selectedEmployee.poste_id ??
        selectedEmployee.posteId ??
        selectedEmployee.poste?.id ??
        null;
      if (posteId) {
        fetchPosteRequiredLevels(posteId);
      }
    };

    const handleStorage = (event) => {
      if (event?.key === "posteCompetencesUpdatedAt") {
        refreshRequiredLevels();
      }
    };

    window.addEventListener("poste-competences-updated", refreshRequiredLevels);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("poste-competences-updated", refreshRequiredLevels);
      window.removeEventListener("storage", handleStorage);
    };
  }, [selectedEmployee, fetchPosteRequiredLevels]);

  const filteredEmployees = useMemo(() => {
    if (!departementId) return [];
    if (departmentIdSet.size === 0) return [];
    return employees.filter((employee) => {
      const deptId =
        employee.departement_id ??
        employee.departementId ??
        employee.unite_id ??
        employee.uniteId ??
        null;
      return deptId != null && departmentIdSet.has(String(deptId));
    });
  }, [employees, departementId, departmentIdSet]);

  // When preSelectedEmployeeId or preSelectedEmployee is provided from parent, use it
  useEffect(() => {
    const employeeIdToSet = preSelectedEmployee?.id ?? preSelectedEmployeeId;
    if (employeeIdToSet) {
      const nextSelectedEmployeeId = String(employeeIdToSet);
      setSelectedEmployeeId(nextSelectedEmployeeId);
      void fetchEmployeeCompetences(nextSelectedEmployeeId, { silent: true });
    }
  }, [preSelectedEmployeeId, preSelectedEmployee?.id, fetchEmployeeCompetences]);

  // Ne plus auto-sélectionner le premier employé - l'utilisateur doit choisir explicitement
  // useEffect(() => {
  //   if (!selectedEmployeeId && !preSelectedEmployeeId && filteredEmployees.length > 0) {
  //     setSelectedEmployeeId(String(filteredEmployees[0].id));
  //   }
  // }, [selectedEmployeeId, preSelectedEmployeeId, filteredEmployees]);

  useEffect(() => {
    // Reset selection if the selected employee is no longer in the filtered list
    // BUT: Don't reset if the employee was pre-selected from parent (CarrieresPage)
    if (
      selectedEmployeeId &&
      !preSelectedEmployeeId && // ← Ne pas réinitialiser si vient du parent
      !filteredEmployees.some((emp) => String(emp.id) === String(selectedEmployeeId))
    ) {
      setSelectedEmployeeId(null);
    }
  }, [filteredEmployees, selectedEmployeeId, preSelectedEmployeeId]);

  useEffect(() => {
    if (embedded) return;
    if (!Array.isArray(filteredEmployees) || filteredEmployees.length === 0) return;

    const employeeIds = filteredEmployees
      .slice(0, PREFETCH_COMPETENCES_LIMIT)
      .map((emp) => String(emp?.id || ""))
      .filter(Boolean);

    if (employeeIds.length === 0) return;

    let cancelled = false;

    const prefetch = async () => {
      for (let i = 0; i < employeeIds.length; i += PREFETCH_COMPETENCES_BATCH) {
        if (cancelled) return;
        const batch = employeeIds.slice(i, i + PREFETCH_COMPETENCES_BATCH);
        await Promise.allSettled(batch.map((id) => fetchEmployeeCompetences(id, { silent: true })));
      }
    };

    void prefetch();

    return () => {
      cancelled = true;
    };
  }, [embedded, filteredEmployees, fetchEmployeeCompetences]);

  const tableRows = useMemo(() => {
    if (!selectedEmployeeId) return [];
    const rowsById = new Map();

    Object.entries(requiredLevelsByCompetenceId || {}).forEach(([competenceId, requiredLevel]) => {
      const catalogEntry = competenceCatalog.find((c) => String(c.id) === String(competenceId));
      const employeeLevel = employeeCompetences?.[competenceId] ?? 0;

      rowsById.set(String(competenceId), {
        id: Number(competenceId) || competenceId,
        competence_id: Number(competenceId) || competenceId,
        nom: catalogEntry?.nom ?? `Compétence #${competenceId}`,
        categorie: catalogEntry?.categorie ?? UNCATEGORIZED_LABEL,
        description: catalogEntry?.description ?? "—",
        niveau: Number(employeeLevel) || 0,
        niveau_requis: Number(requiredLevel) || 0,
      });
    });

    employeeCompetenceRows.forEach((comp) => {
      const competenceId = String(comp?.id ?? comp?.competence_id);
      if (!competenceId) return;

      const catalogEntry = competenceCatalog.find((c) => String(c.id) === competenceId);
      const niveau = comp?.niveau ?? comp?.pivot?.niveau ?? comp?.pivot?.niveau_acquis ?? employeeCompetences?.[competenceId] ?? 0;
      const existingRow = rowsById.get(competenceId);

      rowsById.set(competenceId, {
        id: Number(competenceId) || competenceId,
        competence_id: Number(competenceId) || competenceId,
        nom: existingRow?.nom ?? catalogEntry?.nom ?? comp.nom ?? "—",
        categorie: existingRow?.categorie ?? catalogEntry?.categorie ?? comp.categorie ?? UNCATEGORIZED_LABEL,
        description: existingRow?.description ?? catalogEntry?.description ?? comp.description ?? "—",
        niveau: Number(niveau) || 0,
        niveau_requis: Number(existingRow?.niveau_requis ?? requiredLevelsByCompetenceId?.[competenceId] ?? 0) || 0,
      });
    });

    return Array.from(rowsById.values()).sort((a, b) => {
      const aRequired = Number(a.niveau_requis) > 0 ? 1 : 0;
      const bRequired = Number(b.niveau_requis) > 0 ? 1 : 0;
      if (aRequired !== bRequired) return bRequired - aRequired;
      return String(a.nom || "").localeCompare(String(b.nom || ""), "fr");
    });
  }, [selectedEmployeeId, employeeCompetenceRows, competenceCatalog, employeeCompetences, requiredLevelsByCompetenceId]);

  const categories = useMemo(() => {
    const values = new Set(
      tableRows
        .map((item) => (item?.categorie ? String(item.categorie).trim() : ""))
        .filter(Boolean)
    );
    return ["Tous", ...Array.from(values)];
  }, [tableRows]);

  const normalizedSearch = normalizeValue(searchQuery);

  const filteredRows = useMemo(() => {
    let rows = tableRows;

    // Filtre: Compétences requises uniquement
    if (showRequiredOnly) {
      rows = rows.filter((row) => row.niveau_requis > 0);
    }

    if (categoryFilter !== "Tous") {
      const selectedCategory = normalizeValue(categoryFilter);
      rows = rows.filter((row) => normalizeValue(row.categorie) === selectedCategory);
    }

    if (normalizedSearch) {
      rows = rows.filter((row) =>
        [row.nom, row.categorie, row.description]
          .filter(Boolean)
          .some((value) => normalizeValue(value).includes(normalizedSearch))
      );
    }

    return rows;
  }, [tableRows, categoryFilter, normalizedSearch, showRequiredOnly]);

  useEffect(() => {
    setPage(0);
  }, [categoryFilter, showRequiredOnly, normalizedSearch]);

  const visibleColumns = useMemo(
    () => allColumns.filter((col) => columnVisibility[col.key]),
    [allColumns, columnVisibility]
  );

  const competenceOptions = useMemo(
    () => competenceCatalog.map((comp) => ({ value: comp.id, label: comp.nom })),
    [competenceCatalog]
  );

  const handleColumnsChange = useCallback((column) => {
    setColumnVisibility((prev) => {
      const newVisibility = { ...prev, [column]: !prev[column] };
      localStorage.setItem("competencesColumnVisibility", JSON.stringify(newVisibility));
      return newVisibility;
    });
  }, []);

  const handleFiltersToggle = (isVisible) => {
    if (isVisible) {
      setFiltersVisible(true);
    } else {
      setTimeout(() => {
        setFiltersVisible(false);
      }, 300);
    }
  };

  const handleSelectAllChange = useCallback(
    (eventOrChecked) => {
      const checked = typeof eventOrChecked === "boolean" ? eventOrChecked : Boolean(eventOrChecked?.target?.checked);
      if (checked) {
        setSelectedItems(filteredRows.map((item) => item.id));
      } else {
        setSelectedItems([]);
      }
    },
    [filteredRows]
  );

  const handleCheckboxChange = useCallback((id) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    Swal.fire("Info", "Suppression multiple non disponible.", "info");
  }, []);

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);

  const saveCompetenceLevel = useCallback(
    async (employeeId, competenceId, level) => {
      if (!employeeId || !competenceId) return;
      const competenceIdValue = Number(competenceId);
      const competenceKey = String(competenceIdValue || competenceId);
      const normalizedLevel = Number(level) || 0;
      const exists = employeeCompetenceIds.has(competenceKey);
      try {
        if (normalizedLevel <= 0) {
          if (exists) {
            await apiClient.delete(`/employes/${employeeId}/competences/${competenceIdValue || competenceId}`);
            setEmployeeCompetenceIds((prev) => {
              const next = new Set(prev);
              next.delete(competenceKey);
              return next;
            });
          }
        } else if (exists) {
          await apiClient.put(`/employes/${employeeId}/competences/${competenceIdValue || competenceId}`, {
            niveau: normalizedLevel,
          });
        } else {
          await apiClient.post(`/employes/${employeeId}/competences`, {
            competence_id: competenceIdValue || competenceId,
            niveau: normalizedLevel,
          });
          setEmployeeCompetenceIds((prev) => new Set(prev).add(competenceKey));
        }
      } catch (error) {
        console.error("COMPETENCE_SAVE_ERROR", error);
        Swal.fire("Erreur", "Impossible d'enregistrer le niveau.", "error");
      }
    },
    [employeeCompetenceIds]
  );

  const handleOpenDrawer = useCallback(
    (mode, row = null) => {
      if (!selectedEmployeeId) {
        Swal.fire("Attention", "Veuillez sélectionner un employé.", "warning");
        return;
      }
      setDrawerMode(mode);
      setEditingRow(row);
      setFormState({
        competenceId: row?.id != null || row?.competence_id != null
          ? String(row?.id ?? row?.competence_id)
          : "",
        niveau: row ? String(row.niveau ?? employeeCompetences?.[row.id] ?? "") : "",
      });
      setDrawerOpen(true);
    },
    [selectedEmployeeId, employeeCompetences]
  );

  const handleCloseDrawer = useCallback(() => {
    setDrawerOpen(false);
    setEditingRow(null);
    setFormState({ competenceId: "", niveau: "" });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedEmployeeId) {
      Swal.fire("Attention", "Veuillez sélectionner un employé.", "warning");
      return;
    }
    if (!formState.competenceId) {
      Swal.fire("Attention", "Veuillez sélectionner une compétence.", "warning");
      return;
    }

    const levelValue = Number(formState.niveau || 0);
    const competenceIdValue = Number(formState.competenceId);
    await saveCompetenceLevel(selectedEmployeeId, competenceIdValue || formState.competenceId, levelValue);
    // Refresh employee competences to update the table
    await fetchEmployeeCompetences(selectedEmployeeId, { forceRefresh: true, silent: true });
    Swal.fire("Succès", "Compétence enregistrée.", "success");
    handleCloseDrawer();
  };

  const handleDelete = useCallback(
    async (row) => {
      if (!selectedEmployeeId || !row) return;

      const result = await Swal.fire({
        title: "Êtes-vous sûr ?",
        text: "Cette compétence sera retirée de l'employé.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Supprimer",
        cancelButtonText: "Annuler",
      });

      if (!result.isConfirmed) return;

      await saveCompetenceLevel(selectedEmployeeId, row.id, 0);
      // Refresh the table
      await fetchEmployeeCompetences(selectedEmployeeId, { forceRefresh: true, silent: true });
      Swal.fire("Supprimé", "Compétence retirée.", "success");
    },
    [selectedEmployeeId, saveCompetenceLevel, fetchEmployeeCompetences]
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
  };

  const CustomMenu = React.forwardRef(({ className, "aria-labelledby": labeledBy }, menuRef) => {
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
      >
        <Form>
          {allColumns.map((column) => (
            <Form.Check
              key={column.key}
              type="checkbox"
              id={`checkbox-${column.key}`}
              label={column.label}
              checked={columnVisibility[column.key]}
              onChange={() => handleColumnsChange(column.key)}
            />
          ))}
        </Form>
      </div>
    );
  });

  const content = (
    <div className={embedded ? "" : "career-page"} style={{ overflowY: "auto" }}>
      {showHeader && (
        <div className="section-header">
          <h4 className="section-title">Compétences</h4>
          <p className="section-description">Catalogue global des compétences.</p>
        </div>
      )}

      <div className="with-split-view" style={{ display: "flex", gap: drawerOpen ? "10px" : "0" }}>
        <div
          style={{
            flex: drawerOpen ? "0 0 60%" : "1 1 100%",
            overflowY: "auto",
            overflowX: "auto",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
            padding: "18px 22px 20px",
            backgroundColor: "white",
          }}
        >
          <div className="d-flex align-items-center justify-content-between" style={{ gap: 24, marginBottom: "16px" }}>
            <div style={{ flex: 1 }}>
              <SectionTitle icon="fas fa-star" text="Compétences" />
              <p className="section-description text-muted mb-0">
                {selectedEmployeeId
                  ? showRequiredOnly
                    ? `${filteredRows.length} compétence${filteredRows.length > 1 ? "s" : ""} requise${filteredRows.length > 1 ? "s" : ""} pour le poste actuel.`
                    : `${filteredRows.length} compétence${filteredRows.length > 1 ? "s" : ""} (poste + employé). Le niveau requis correspond au poste actuel de l'employé.`
                  : "Sélectionnez un employé pour voir ses compétences"}
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <FontAwesomeIcon
                onClick={() => handleFiltersToggle(!filtersVisible)}
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
                onClick={() => handleOpenDrawer("add")}
                className={`d-flex align-items-center justify-content-center ${!selectedEmployeeId ? "disabled-btn" : ""}`}
                size="sm"
                disabled={!selectedEmployeeId}
                style={{
                  minWidth: "220px",
                  height: "38px",
                  backgroundColor: selectedEmployeeId ? "#3a8a90" : "#9ca3af",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  boxShadow: selectedEmployeeId ? "0 3px 8px rgba(58, 138, 144, 0.28)" : "none",
                  cursor: selectedEmployeeId ? "pointer" : "not-allowed",
                }}
              >
                Ajouter compétence
              </Button>

              <Dropdown ref={dropdownRef} show={showDropdown} onToggle={(isOpen) => setShowDropdown(isOpen)}>
                <Dropdown.Toggle
                  as="button"
                  id="dropdown-visibility"
                  title="Visibilité Colonnes"
                  style={iconButtonStyle}
                >
                  <FontAwesomeIcon icon={faSliders} style={{ width: 18, height: 18, color: "#4b5563" }} />
                </Dropdown.Toggle>
                <Dropdown.Menu as={CustomMenu} />
              </Dropdown>
            </div>
          </div>

          <AnimatePresence>
            {filtersVisible && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="filters-container"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "30px",
                  padding: "15px 25px",
                  overflowX: "auto",
                  flexWrap: "nowrap",
                  width: "100%",
                  WebkitOverflowScrolling: "touch",
                  boxSizing: "border-box",
                }}
              >
                <div
                  className="filters-icon-section"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flexShrink: 0,
                    marginRight: "5px",
                    position: "relative",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a90a4" strokeWidth="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                  <span className="filters-title">Filtres</span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "nowrap" }}>
                  <div style={{ display: "flex", alignItems: "center", marginRight: "46px" }}>
                    <label className="filter-label" style={{ fontSize: "0.9rem", marginRight: "-44px", fontWeight: 600, color: "#2c3e50" }}>
                      Catégorie
                    </label>
                    <select
                      value={categoryFilter}
                      onChange={(event) => setCategoryFilter(event.target.value)}
                      className="filter-input"
                      style={{ minWidth: 140, maxWidth: 180, height: 30, fontSize: "0.9rem", padding: "2px 6px", borderRadius: 6 }}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <label className="filter-label" style={{ fontSize: "0.9rem", fontWeight: 600, color: "#2c3e50", whiteSpace: "nowrap" }}>
                      Affichage
                    </label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => setShowRequiredOnly(false)}
                        style={{
                          padding: "6px 14px",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          borderRadius: "6px",
                          border: showRequiredOnly ? "1px solid #cbd5e1" : "2px solid #2563eb",
                          backgroundColor: showRequiredOnly ? "#ffffff" : "#2563eb",
                          color: showRequiredOnly ? "#64748b" : "#ffffff",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Toutes
                      </button>
                      <button
                        onClick={() => setShowRequiredOnly(true)}
                        style={{
                          padding: "6px 14px",
                          fontSize: "0.85rem",
                          fontWeight: 600,
                          borderRadius: "6px",
                          border: showRequiredOnly ? "2px solid #2563eb" : "1px solid #cbd5e1",
                          backgroundColor: showRequiredOnly ? "#2563eb" : "#ffffff",
                          color: showRequiredOnly ? "#ffffff" : "#64748b",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Requises uniquement
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ExpandRTable
            columns={visibleColumns}
            data={filteredRows}
            searchTerm={normalizedSearch}
            selectAll={selectedItems.length === filteredRows.length && filteredRows.length > 0}
            selectedItems={selectedItems}
            handleSelectAllChange={handleSelectAllChange}
            handleCheckboxChange={handleCheckboxChange}
            handleDeleteSelected={handleDeleteSelected}
            rowsPerPage={rowsPerPage}
            page={page}
            handleChangePage={handleChangePage}
            handleChangeRowsPerPage={handleChangeRowsPerPage}
            handleEdit={(row) => handleOpenDrawer("edit", row)}
            handleDelete={(rowId) => {
              const row = filteredRows.find((item) => item.id === rowId) || null;
              if (row) handleDelete(row);
            }}
            loading={loading || (loadingEmployeeCompetences && tableRows.length === 0)}
            loadingText="Chargement des compétences..."
            canBulkDelete={false}
          />
        </div>

        {drawerOpen && (
          <div
            style={{
              flex: "0 0 40%",
              overflowY: "auto",
              backgroundColor: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              position: "relative",
              height: "100%",
            }}
          >
            <div className="cnss-side-panel" onClick={(event) => event.stopPropagation()}>
              <div className="cnss-form-header">
                <div style={{ width: "24px" }}></div>
                <h5>{drawerMode === "edit" ? "Modifier compétence" : "Ajouter compétence"}</h5>
                <button className="cnss-close-btn" onClick={handleCloseDrawer} type="button" aria-label="Fermer">
                  ×
                </button>
              </div>

              <div className="cnss-form-body">
                <Form onSubmit={handleSubmit} id="competenceForm">
                  <div className="row g-3">
                    <div className="col-12">
                      <div className="cnss-field-group">
                        <label className="cnss-form-label">Employé</label>
                        <Form.Control
                          className="cnss-form-control"
                          type="text"
                          value={
                            preSelectedEmployee
                              ? `${preSelectedEmployee.nom ?? ""} ${preSelectedEmployee.prenom ?? ""}`.trim()
                              : filteredEmployees.find((emp) => String(emp.id) === String(selectedEmployeeId))?.full_name || ""
                          }
                          readOnly
                          style={{ backgroundColor: "#f8f9fa", cursor: "not-allowed" }}
                        />
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="cnss-field-group">
                        <label className="cnss-form-label">Compétence <span className="text-danger">*</span></label>
                        <Form.Select
                          className="cnss-form-control"
                          value={formState.competenceId}
                          onChange={(event) => setFormState((prev) => ({ ...prev, competenceId: event.target.value }))}
                          disabled={drawerMode === "edit"}
                        >
                          <option value="">Sélectionner une compétence</option>
                          {competenceOptions.map((comp) => (
                            <option key={comp.value} value={comp.value}>{comp.label}</option>
                          ))}
                        </Form.Select>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="cnss-field-group">
                        <label className="cnss-form-label">Niveau <span className="text-danger">*</span></label>
                        <Form.Select
                          className="cnss-form-control"
                          value={formState.niveau}
                          onChange={(event) => setFormState((prev) => ({ ...prev, niveau: event.target.value }))}
                        >
                          <option value="">Sélectionner un niveau</option>
                          {[1, 2, 3, 4, 5].map((level) => (
                            <option key={level} value={level}>{level}</option>
                          ))}
                        </Form.Select>
                      </div>
                    </div>
                  </div>
                </Form>
              </div>

              <div className="cnss-form-footer">
                <button type="button" className="cnss-btn-secondary" onClick={handleCloseDrawer}>
                  Annuler
                </button>
                <button type="submit" form="competenceForm" className="cnss-btn-primary">
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{ ...dynamicStyles, minHeight: "100vh", backgroundColor: "#ffffff" }}>
        <Box component="main" sx={{ flexGrow: 1, p: 0, mt: 12, overflowY: "auto" }}>
          {content}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default SkillsManagement;
