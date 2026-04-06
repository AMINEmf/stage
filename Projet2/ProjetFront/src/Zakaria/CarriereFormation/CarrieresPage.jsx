import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import apiClient from "../../services/apiClient";
import "../Employe/DepartementManager.css";
import "../../ComponentHistorique/DepartementPanel.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { IoFolderOpenOutline } from "react-icons/io5";
import { FaMinus, FaPlus } from "react-icons/fa6";
import { FaBell } from "react-icons/fa";
import Swal from "sweetalert2";
import { useHeader } from "../../Acceuil/HeaderContext";
import { useOpen } from "../../Acceuil/OpenProvider";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box, Tabs, Tab } from "@mui/material";
import CarrieresTable from "./CarrieresTable";
import SkillsManagement from "./SkillsManagement";
import PostesEnAttenteTab from "./PostesEnAttenteTab";
import "./CareerTraining.css";
import "../Style.css";

const TabPanel = ({ value, index, children }) => {
  if (value !== index) return null;
  return (
    <div
      style={{
        paddingTop: "12px",
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
    </div>
  );
};

const normalizeDepartementsPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.departements)) return payload.departements;
  return [];
};

const EMPLOYEE_COMPETENCES_CACHE_KEY = "cf_employee_competences_cache_v1";
const EMPLOYEE_COMPETENCES_CACHE_TTL_MS = 2 * 60 * 1000;
const EMPLOYEE_PENDING_POSTES_CACHE_KEY = "cf_employee_pending_postes_cache_v1";
const EMPLOYEE_PENDING_POSTES_CACHE_TTL_MS = 2 * 60 * 1000;
const DEPARTMENT_PREFETCH_CHUNK_SIZE = 50;
const DEPARTMENT_PREFETCH_BATCH_CONCURRENCY = 2;
const DEPARTMENT_PREFETCH_RECENT_MS = 90 * 1000;
const DEPARTMENT_PREFETCH_FALLBACK_BATCH = 8;
const GLOBAL_COMPETENCE_REQUESTS_KEY = "__cf_competence_prefetch_requests";
const GLOBAL_PENDING_POSTES_REQUESTS_KEY = "__cf_pending_postes_prefetch_requests";

const chunkArray = (items, size) => {
  const list = Array.isArray(items) ? items : [];
  if (!Number.isFinite(size) || size <= 0) return [list];
  const chunks = [];
  for (let i = 0; i < list.length; i += size) {
    chunks.push(list.slice(i, i + size));
  }
  return chunks;
};

const getSharedRequestMap = (key) => {
  if (typeof window === "undefined") return null;
  const globalObj = window;
  if (!(globalObj[key] instanceof Map)) {
    globalObj[key] = new Map();
  }
  return globalObj[key];
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

const getCachedEmployeeCompetenceEntry = (employeeId) => {
  const store = readEmployeeCompetencesStore();
  const entry = store[String(employeeId)];
  if (!entry || !Array.isArray(entry.rows)) return null;

  const ts = Number(entry.ts) || 0;
  return {
    ts,
    rows: entry.rows,
    isFresh: ts > 0 && Date.now() - ts <= EMPLOYEE_COMPETENCES_CACHE_TTL_MS,
  };
};

const persistEmployeeCompetenceEntry = (employeeId, rows) => {
  try {
    const store = readEmployeeCompetencesStore();
    store[String(employeeId)] = {
      ts: Date.now(),
      rows: Array.isArray(rows) ? rows : [],
    };
    localStorage.setItem(EMPLOYEE_COMPETENCES_CACHE_KEY, JSON.stringify(store));
  } catch {
    // ignore cache persistence failures
  }
};

const persistEmployeeCompetenceEntries = (entriesByEmployeeId, employeeIds = []) => {
  try {
    const source =
      entriesByEmployeeId &&
      typeof entriesByEmployeeId === "object" &&
      !Array.isArray(entriesByEmployeeId)
        ? entriesByEmployeeId
        : {};

    const ids = (Array.isArray(employeeIds) && employeeIds.length > 0
      ? employeeIds
      : Object.keys(source)
    )
      .map((id) => String(id))
      .filter(Boolean);

    if (ids.length === 0) return;

    const now = Date.now();
    const store = readEmployeeCompetencesStore();
    ids.forEach((id) => {
      const rows = source[id] ?? source[String(id)] ?? source[Number(id)] ?? [];
      store[id] = {
        ts: now,
        rows: Array.isArray(rows) ? rows : [],
      };
    });
    localStorage.setItem(EMPLOYEE_COMPETENCES_CACHE_KEY, JSON.stringify(store));
  } catch {
    // ignore cache persistence failures
  }
};

const readEmployeePendingPostesStore = () => {
  try {
    const raw = localStorage.getItem(EMPLOYEE_PENDING_POSTES_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const getCachedEmployeePendingPostesEntry = (employeeId) => {
  const store = readEmployeePendingPostesStore();
  const entry = store[String(employeeId)];
  if (!entry || !Array.isArray(entry.rows)) return null;

  const ts = Number(entry.ts) || 0;
  return {
    ts,
    rows: entry.rows,
    isFresh: ts > 0 && Date.now() - ts <= EMPLOYEE_PENDING_POSTES_CACHE_TTL_MS,
  };
};

const persistEmployeePendingPostesEntry = (employeeId, rows) => {
  try {
    const store = readEmployeePendingPostesStore();
    store[String(employeeId)] = {
      ts: Date.now(),
      rows: Array.isArray(rows) ? rows : [],
    };
    localStorage.setItem(EMPLOYEE_PENDING_POSTES_CACHE_KEY, JSON.stringify(store));
  } catch {
    // ignore cache persistence failures
  }
};

const persistEmployeePendingPostesEntries = (entriesByEmployeeId, employeeIds = []) => {
  try {
    const source =
      entriesByEmployeeId &&
      typeof entriesByEmployeeId === "object" &&
      !Array.isArray(entriesByEmployeeId)
        ? entriesByEmployeeId
        : {};

    const ids = (Array.isArray(employeeIds) && employeeIds.length > 0
      ? employeeIds
      : Object.keys(source)
    )
      .map((id) => String(id))
      .filter(Boolean);

    if (ids.length === 0) return;

    const now = Date.now();
    const store = readEmployeePendingPostesStore();
    ids.forEach((id) => {
      const rows = source[id] ?? source[String(id)] ?? source[Number(id)] ?? [];
      store[id] = {
        ts: now,
        rows: Array.isArray(rows) ? rows : [],
      };
    });
    localStorage.setItem(EMPLOYEE_PENDING_POSTES_CACHE_KEY, JSON.stringify(store));
  } catch {
    // ignore cache persistence failures
  }
};

const CarrieresPage = () => {
  const [departements, setDepartements] = useState([]);
  const [selectedDepartementId, setSelectedDepartementId] = useState(null);
  const [selectedDepartementName, setSelectedDepartementName] = useState(null);
  const [expandedDepartements, setExpandedDepartements] = useState({});
  const [includeSubDepartments, setIncludeSubDepartments] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [isAddingCarriere, setIsAddingCarriere] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  // Employee selection state
  const [allEmployees, setAllEmployees] = useState([]); // All employees cache
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const { setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, searchQuery, clearActions } = useHeader();
  const { dynamicStyles } = useOpen();
  const carrieresTableRef = useRef(null);
  const competencesPrefetchRequestsRef = useRef(new Map());
  const pendingPostesPrefetchRequestsRef = useRef(new Map());
  const departmentPrefetchRequestsRef = useRef(new Map());
  const departmentPrefetchedAtRef = useRef(new Map());
  const normalizedDepartements = useMemo(() => normalizeDepartementsPayload(departements), [departements]);

  useEffect(() => {
    setTitle("Carrieres");
    setOnPrint(() => () => {
      if (carrieresTableRef.current) carrieresTableRef.current.handlePrint();
    });
    setOnExportPDF(() => () => {
      if (carrieresTableRef.current) carrieresTableRef.current.exportToPDF();
    });
    setOnExportExcel(() => () => {
      if (carrieresTableRef.current) carrieresTableRef.current.exportToExcel();
    });
    return () => {
      clearActions();
    };
  }, [setTitle, setOnPrint, setOnExportPDF, setOnExportExcel, clearActions]);

  const fetchDepartmentHierarchy = async () => {
    try {
      const response = await apiClient.get("/departements/hierarchy");
      const normalized = normalizeDepartementsPayload(response.data);
      setDepartements(normalized);
      localStorage.setItem("departmentHierarchy", JSON.stringify(normalized));
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401) {
        Swal.fire({
          icon: "warning",
          title: "Session expirée",
          text: "Veuillez vous reconnecter pour charger la hiérarchie des départements.",
        });
      } else if (status === 403) {
        Swal.fire({
          icon: "error",
          title: "Accès refusé",
          text: "Vous n'avez pas l'autorisation de voir la hiérarchie des départements.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: "Impossible de charger la hiérarchie des départements.",
        });
      }
    }
  };

  useEffect(() => {
    const departmentsFromStorage = localStorage.getItem("departmentHierarchy");
    if (departmentsFromStorage) {
      try {
        const parsed = JSON.parse(departmentsFromStorage);
        setDepartements(normalizeDepartementsPayload(parsed));
      } catch (e) {
        setDepartements([]);
      }
    }
    fetchDepartmentHierarchy();

    // Load all employees once with cache
    const fetchAllEmployees = async () => {
      let hasCachedData = false;
      
      // Load from cache immediately
      try {
        const cachedData = localStorage.getItem('employees_cache');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAllEmployees(parsed);
            hasCachedData = true;
          }
        }
      } catch (e) {
        console.warn('Cache employés invalide:', e);
      }

      // Fetch fresh data from API
      try {
        const response = await apiClient.get("/employes/list");
        const data = response.data;
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        setAllEmployees(list);
        
        // Update cache
        try {
          localStorage.setItem('employees_cache', JSON.stringify(list));
        } catch (e) {
          console.warn('Erreur sauvegarde cache employés:', e);
        }
      } catch (error) {
        console.error("Error loading all employees:", error);
        if (!hasCachedData) {
          setAllEmployees([]);
        }
      }
    };

    fetchAllEmployees();
  }, []);

  // Fetch employees when department changes
  const collectDeptIds = useCallback((dept) => {
    if (!dept) return [];
    let ids = [dept.id];
    if (includeSubDepartments && dept.children) {
      dept.children.forEach((child) => {
        ids = ids.concat(collectDeptIds(child));
      });
    }
    return ids;
  }, [includeSubDepartments]);

  const findDeptById = useCallback((list, id) => {
    if (!Array.isArray(list)) return null;
    for (const dept of list) {
      if (dept.id === id) return dept;
      const children = Array.isArray(dept?.children) ? dept.children : [];
      if (children.length > 0) {
        const found = findDeptById(children, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  const findDepartmentName = useCallback((deptId) => {
    if (!deptId) return "";
    const dept = findDeptById(normalizedDepartements, deptId);
    return dept?.nom ?? "";
  }, [normalizedDepartements, findDeptById]);

  // Filter employees from cache when department selection changes
  useEffect(() => {
    if (!selectedDepartementId) {
      setEmployees([]);
      setSelectedEmployee(null);
      return;
    }

    // Filter employees locally from cache - instant!
    const dept = findDeptById(normalizedDepartements, selectedDepartementId);
    const allDeptIds = collectDeptIds(dept);
    
    const filtered = allEmployees.filter(emp => {
      const empDeptId = emp.departement_id || emp.department_id;
      return allDeptIds.includes(empDeptId);
    });
    
    setEmployees(filtered);

    // Keep the current selection when background refreshes update the employee list.
    setSelectedEmployee((prevSelected) => {
      if (!prevSelected?.id) return null;
      const nextSelected = filtered.find(
        (emp) => String(emp?.id) === String(prevSelected.id)
      );
      return nextSelected || null;
    });
  }, [selectedDepartementId, includeSubDepartments, normalizedDepartements, allEmployees, collectDeptIds, findDeptById]);

  const filteredEmployeeList = useMemo(() => {
    if (!employeeSearch.trim()) return employees;
    const terms = employeeSearch.toLowerCase().split(/\s+/).filter(Boolean);
    return employees.filter((emp) => {
      const text = `${emp.nom ?? ""} ${emp.prenom ?? ""} ${emp.matricule ?? ""}`.toLowerCase();
      return terms.every((t) => text.includes(t));
    });
  }, [employees, employeeSearch]);

  const primeEmployeeCompetencesCache = useCallback(async (employeeId, options = {}) => {
    if (!employeeId) return;

    const { forceRefresh = false } = options;
    const cacheKey = String(employeeId);
    const cachedEntry = getCachedEmployeeCompetenceEntry(cacheKey);
    const sharedRequests = getSharedRequestMap(GLOBAL_COMPETENCE_REQUESTS_KEY);

    if (!forceRefresh && cachedEntry?.isFresh) {
      return;
    }

    const sharedExistingRequest = sharedRequests?.get(cacheKey);
    if (sharedExistingRequest) {
      await sharedExistingRequest;
      return;
    }

    const existingRequest = competencesPrefetchRequestsRef.current.get(cacheKey);
    if (existingRequest) {
      await existingRequest;
      return;
    }

    const request = apiClient
      .get(`/employes/${employeeId}/competences`)
      .then((response) => {
        const payload = response?.data?.data ?? response?.data ?? [];
        const rows = Array.isArray(payload) ? payload : [];
        persistEmployeeCompetenceEntry(cacheKey, rows);
      })
      .catch(() => {
        // Silent prefetch: errors are ignored here.
      })
      .finally(() => {
        competencesPrefetchRequestsRef.current.delete(cacheKey);
        sharedRequests?.delete(cacheKey);
      });

    competencesPrefetchRequestsRef.current.set(cacheKey, request);
    sharedRequests?.set(cacheKey, request);
    await request;
  }, []);

  const primeEmployeePendingPostesCache = useCallback(async (employeeId, options = {}) => {
    if (!employeeId) return;

    const { forceRefresh = false } = options;
    const cacheKey = String(employeeId);
    const cachedEntry = getCachedEmployeePendingPostesEntry(cacheKey);
    const sharedRequests = getSharedRequestMap(GLOBAL_PENDING_POSTES_REQUESTS_KEY);

    if (!forceRefresh && cachedEntry?.isFresh) {
      return;
    }

    const sharedExistingRequest = sharedRequests?.get(cacheKey);
    if (sharedExistingRequest) {
      await sharedExistingRequest;
      return;
    }

    const existingRequest = pendingPostesPrefetchRequestsRef.current.get(cacheKey);
    if (existingRequest) {
      await existingRequest;
      return;
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
        persistEmployeePendingPostesEntry(cacheKey, rows);
      })
      .catch(() => {
        // Silent prefetch: errors are ignored here.
      })
      .finally(() => {
        pendingPostesPrefetchRequestsRef.current.delete(cacheKey);
        sharedRequests?.delete(cacheKey);
      });

    pendingPostesPrefetchRequestsRef.current.set(cacheKey, request);
    sharedRequests?.set(cacheKey, request);
    await request;
  }, []);

  const prefetchDepartmentEmployeeData = useCallback(
    async (employeeIds) => {
      const ids = (Array.isArray(employeeIds) ? employeeIds : [])
        .map((id) => String(id || ""))
        .filter(Boolean);

      if (ids.length === 0) return;

      const idChunks = chunkArray(ids, DEPARTMENT_PREFETCH_CHUNK_SIZE);
      for (let i = 0; i < idChunks.length; i += DEPARTMENT_PREFETCH_BATCH_CONCURRENCY) {
        const chunkGroup = idChunks.slice(i, i + DEPARTMENT_PREFETCH_BATCH_CONCURRENCY);

        await Promise.allSettled(
          chunkGroup.map(async (chunk) => {
            const [competencesResult, pendingResult] = await Promise.allSettled([
              apiClient.post("/employes/competences/batch", { employee_ids: chunk }),
              apiClient.post("/carrieres/postes-en-attente/batch", { employee_ids: chunk }),
            ]);

            if (competencesResult.status === "fulfilled") {
              const payload = competencesResult.value?.data?.data ?? competencesResult.value?.data ?? {};
              persistEmployeeCompetenceEntries(payload, chunk);
            } else {
              for (let j = 0; j < chunk.length; j += DEPARTMENT_PREFETCH_FALLBACK_BATCH) {
                const fallbackChunk = chunk.slice(j, j + DEPARTMENT_PREFETCH_FALLBACK_BATCH);
                await Promise.allSettled(fallbackChunk.map((id) => primeEmployeeCompetencesCache(id)));
              }
            }

            if (pendingResult.status === "fulfilled") {
              const payload = pendingResult.value?.data?.data ?? pendingResult.value?.data ?? {};
              persistEmployeePendingPostesEntries(payload, chunk);
            } else {
              for (let j = 0; j < chunk.length; j += DEPARTMENT_PREFETCH_FALLBACK_BATCH) {
                const fallbackChunk = chunk.slice(j, j + DEPARTMENT_PREFETCH_FALLBACK_BATCH);
                await Promise.allSettled(fallbackChunk.map((id) => primeEmployeePendingPostesCache(id)));
              }
            }
          })
        );
      }
    },
    [primeEmployeeCompetencesCache, primeEmployeePendingPostesCache]
  );

  useEffect(() => {
    if (!selectedDepartementId || !Array.isArray(employees) || employees.length === 0) return;

    const employeeIds = employees
      .map((emp) => String(emp?.id || ""))
      .filter(Boolean);

    if (employeeIds.length === 0) return;

    const prefetchKey = `${selectedDepartementId}:${includeSubDepartments ? "1" : "0"}`;
    const lastPrefetchTs = Number(departmentPrefetchedAtRef.current.get(prefetchKey) || 0);
    if (lastPrefetchTs > 0 && Date.now() - lastPrefetchTs < DEPARTMENT_PREFETCH_RECENT_MS) {
      return;
    }

    const existingRequest = departmentPrefetchRequestsRef.current.get(prefetchKey);
    if (existingRequest) {
      return;
    }

    let cancelled = false;
    const request = (async () => {
      await prefetchDepartmentEmployeeData(employeeIds);
      if (!cancelled) {
        departmentPrefetchedAtRef.current.set(prefetchKey, Date.now());
      }
    })().finally(() => {
      departmentPrefetchRequestsRef.current.delete(prefetchKey);
    });

    departmentPrefetchRequestsRef.current.set(prefetchKey, request);

    return () => {
      cancelled = true;
    };
  }, [
    selectedDepartementId,
    includeSubDepartments,
    employees,
    prefetchDepartmentEmployeeData,
  ]);

  const toggleExpand = (departementId) => {
    setExpandedDepartements((prev) => ({
      ...prev,
      [departementId]: !prev[departementId],
    }));
  };

  const handleDepartementClick = (departementId, departementName) => {
    if (departementId) {
      setSelectedDepartementId(departementId);
      setSelectedDepartementName(departementName);
    }
  };

  const renderDepartement = (departement) => {
    const children = Array.isArray(departement?.children) ? departement.children : [];

    return (
      <li key={departement.id} style={{ listStyleType: "none" }}>
        <div className={`department-item ${departement.id === selectedDepartementId ? "selected" : ""}`}>
          <div className="department-item-content">
            {children.length > 0 && (
              <button className="expand-button" onClick={() => toggleExpand(departement.id)}>
                {expandedDepartements[departement.id] ? <FaMinus size={14} /> : <FaPlus size={14} />}
              </button>
            )}
            {children.length === 0 && (
              <div style={{ width: "24px", marginRight: "8px" }}></div>
            )}

            <span
              onClick={() => handleDepartementClick(departement.id, departement.nom)}
              className={`common-text ${selectedDepartementId === departement.id ? "selected" : ""}`}
            >
              <IoFolderOpenOutline size={18} />
              {departement.nom}
            </span>
          </div>
        </div>

        {expandedDepartements[departement.id] && children.length > 0 && (
          <ul className="sub-departments">{children.map((child) => renderDepartement(child))}</ul>
        )}
      </li>
    );
  };

  const handleFiltersToggle = (isVisible) => {
    if (isVisible) {
      setFiltersVisible(true);
    } else {
      setTimeout(() => {
        setFiltersVisible(false);
      }, 300);
    }
  };

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
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          <div className="departement_home1 career-scroll-layout career-professional-layout" style={{ gap: "12px", padding: "12px" }}>
            {/* 1. Department tree */}
            <ul className="departement_list">
              <li style={{ listStyleType: "none" }}>
                <div
                  className="checkbox-container"
                  style={{
                    marginTop: "5%",
                    width: "90%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginLeft: "5%",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={includeSubDepartments}
                    onChange={(event) => setIncludeSubDepartments(event.target.checked)}
                    id="include-sub-deps"
                  />
                  <label htmlFor="include-sub-deps">Inclure les sous-départements</label>
                </div>
              </li>
              <div className="separator" style={{ marginTop: "-1%" }}></div>
              {normalizedDepartements.length === 0 && (
                <li style={{ listStyleType: "none", padding: "1rem", color: "#666" }}>
                  Aucun département trouvé
                </li>
              )}
              {normalizedDepartements.map((departement) => renderDepartement(departement))}
            </ul>

            {/* 2. Employee list panel */}
            <div className="employee-panel career-employee-panel" style={{ minWidth: "240px", maxWidth: "300px", display: "flex", flexDirection: "column" }}>
              <input
                type="text"
                placeholder="Rechercher"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="search-input"
              />

              {!selectedDepartementId ? (
                <p style={{ textAlign: "center", marginTop: "20px", color: "#999", fontSize: "0.9rem" }}>
                  Veuillez sélectionner un département.
                </p>
              ) : loadingEmployees ? (
                <p style={{ textAlign: "center", marginTop: "20px", color: "#999" }}>Chargement...</p>
              ) : filteredEmployeeList.length === 0 ? (
                <p style={{ textAlign: "center", marginTop: "20px", color: "#999", fontSize: "0.9rem" }}>
                  Aucun employé trouvé.
                </p>
              ) : (
                <ul className="employee-list" style={{ flex: 1, overflowY: "auto" }}>
                  {filteredEmployeeList.map((emp) => {
                    const isSelected = selectedEmployee?.id === emp.id;
                    return (
                      <li
                        key={emp.id}
                        className={`employee-item ${isSelected ? "selected" : ""}`}
                        onMouseEnter={() => {
                          void primeEmployeeCompetencesCache(emp.id);
                          void primeEmployeePendingPostesCache(emp.id);
                        }}
                        onClick={() => {
                          void primeEmployeeCompetencesCache(emp.id);
                          void primeEmployeePendingPostesCache(emp.id);
                          setSelectedEmployee(emp);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div className={`career-employee-checkbox ${isSelected ? "checked" : ""}`} aria-hidden="true">
                            {isSelected ? (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3a8a90" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <path d="M9 12l2 2 4-4"></path>
                              </svg>
                            ) : (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                              </svg>
                            )}
                          </div>

                          <div className="employee-avatar">
                            {emp.nom?.charAt(0).toUpperCase() || ""}
                            {emp.prenom?.charAt(0).toUpperCase() || ""}
                          </div>
                          <div className="employee-info">
                            <div className="employee-name">
                              {emp.nom} {emp.prenom}
                            </div>
                            <div className="employee-details">
                              {emp.matricule}
                              <span style={{ marginLeft: "10px" }}></span>
                              {findDepartmentName(emp.departement_id)}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* 3. Main content: tabs */}
            <div
              className="career-main-panel"
              style={{
                flex: 1,
                width: "100%",
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {selectedEmployee && (
                <div
                  className="career-selected-employee-banner"
                  style={{
                    padding: "10px 16px",
                    borderBottom: "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                    borderRadius: "8px 8px 0 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      backgroundColor: "#3a8a90",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.9rem",
                    }}
                  >
                    {selectedEmployee.nom?.charAt(0).toUpperCase() || ""}
                    {selectedEmployee.prenom?.charAt(0).toUpperCase() || ""}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "1rem", color: "#1e293b" }}>
                      {selectedEmployee.nom} {selectedEmployee.prenom}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {selectedEmployee.matricule} — {selectedDepartementName}
                    </div>
                  </div>
                </div>
              )}

              <Tabs
                value={tabIndex}
                onChange={(event, value) => setTabIndex(value)}
                textColor="primary"
                indicatorColor="primary"
                sx={{
                  borderBottom: "1px solid #e2e8f0",
                  px: 1,
                  background: "#fbfdff",
                  borderTopLeftRadius: "10px",
                  borderTopRightRadius: "10px",
                  "& .MuiTab-root": {
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.86rem",
                    minHeight: 46,
                    color: "#64748b",
                  },
                  "& .Mui-selected": {
                    color: "#0f766e !important",
                  },
                  "& .MuiTabs-indicator": {
                    height: 3,
                    borderRadius: 3,
                    backgroundColor: "#0f766e",
                  },
                }}
              >
                <Tab label="Carrière & Parcours" />
                <Tab label="Compétences" />
                <Tab 
                  label={
                    <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <FaBell style={{ fontSize: "0.9rem" }} />
                      Propositions en cours
                    </span>
                  } 
                />
              </Tabs>

              <TabPanel value={tabIndex} index={0}>
                <CarrieresTable
                  departementId={selectedDepartementId}
                  departementName={selectedDepartementName}
                  includeSubDepartments={includeSubDepartments}
                  departements={normalizedDepartements}
                  setIsAddingCarriere={setIsAddingCarriere}
                  globalSearch={searchQuery}
                  filtersVisible={filtersVisible}
                  handleFiltersToggle={handleFiltersToggle}
                  selectedEmployee={selectedEmployee}
                  onEmployeeSelect={setSelectedEmployee}
                  ref={carrieresTableRef}
                />
              </TabPanel>

              <TabPanel value={tabIndex} index={1}>
                <SkillsManagement
                  embedded
                  showHeader={false}
                  departementId={selectedDepartementId}
                  departements={departements}
                  includeSubDepartments={includeSubDepartments}
                  preSelectedEmployeeId={selectedEmployee?.id}
                  preSelectedEmployee={selectedEmployee}
                />
              </TabPanel>

              <TabPanel value={tabIndex} index={2}>
                <PostesEnAttenteTab
                  employeeId={selectedEmployee?.id}
                  onPosteUpdate={() => {
                    // Refresh the carrieres table when a poste is accepted/refused
                    if (carrieresTableRef.current) {
                      carrieresTableRef.current.refreshData();
                    }
                  }}
                />
              </TabPanel>
            </div>
          </div>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default CarrieresPage;

