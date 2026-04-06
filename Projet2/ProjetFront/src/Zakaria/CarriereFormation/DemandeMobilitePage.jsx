import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Box, ThemeProvider, createTheme } from "@mui/material";
import Swal from "sweetalert2";
import { useHeader } from "../../Acceuil/HeaderContext";
import { useOpen } from "../../Acceuil/OpenProvider";
import apiClient from "../../services/apiClient";
import { API_BASE_URL } from "../../services/apiConfig";
import DemandeMobiliteTable from "./DemandeMobiliteTable";
import AddDemandeMobilite from "./AddDemandeMobilite";
import EditDemandeMobilite from "./EditDemandeMobilite";
import ViewDemandeMobilite from "./ViewDemandeMobilite";
import "../Style.css";
import "./CareerTraining.css";

const DEMANDES_MOBILITE_CACHE_KEY = "demandes-mobilite:rows:v2";
const DEMANDES_MOBILITE_CACHE_TTL_MS = 2 * 60 * 1000;
const DEMANDES_MOBILITE_LEGACY_CACHE_KEY = "demandes-mobilite:rows";

const DEMANDES_MOBILITE_DEFAULT_FILTERS = {
  search: "",
  statut: "",
  type_mobilite: "",
  departement_id: "",
  date_from: "",
  date_to: "",
};

const normalizeDemandesFilters = (activeFilters = {}) => {
  const normalized = {
    search: activeFilters.search ?? "",
    statut: activeFilters.statut ?? "",
    type_mobilite: activeFilters.type_mobilite ?? "",
    departement_id: activeFilters.departement_id ?? "",
    date_from: activeFilters.date_from ?? "",
    date_to: activeFilters.date_to ?? "",
  };

  return Object.fromEntries(
    Object.entries(normalized).map(([key, value]) => [key, String(value).trim()])
  );
};

const buildDemandesCacheKey = (activeFilters = {}) => {
  const normalized = normalizeDemandesFilters(activeFilters);
  return JSON.stringify(normalized);
};

const loadDemandesCacheStore = () => {
  try {
    const raw = localStorage.getItem(DEMANDES_MOBILITE_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object" && parsed.entries && typeof parsed.entries === "object") {
      return parsed;
    }
  } catch {
  }

  try {
    const legacyRaw = sessionStorage.getItem(DEMANDES_MOBILITE_LEGACY_CACHE_KEY);
    const legacyParsed = legacyRaw ? JSON.parse(legacyRaw) : [];
    const legacyRows = Array.isArray(legacyParsed) ? legacyParsed : [];
    if (legacyRows.length > 0) {
      const defaultKey = buildDemandesCacheKey(DEMANDES_MOBILITE_DEFAULT_FILTERS);
      return {
        entries: {
          [defaultKey]: {
            rows: legacyRows,
            timestamp: Date.now(),
          },
        },
      };
    }
  } catch {
  }

  return { entries: {} };
};

const persistDemandesCacheStore = (cacheStore) => {
  try {
    localStorage.setItem(DEMANDES_MOBILITE_CACHE_KEY, JSON.stringify(cacheStore));
  } catch {
  }
};

const extractApiError = (error, fallback) => {
  const apiMessage = error?.response?.data?.message;
  const validation = error?.response?.data?.errors;

  if (validation && typeof validation === "object") {
    const firstKey = Object.keys(validation)[0];
    if (firstKey && Array.isArray(validation[firstKey]) && validation[firstKey][0]) {
      return validation[firstKey][0];
    }
  }

  return apiMessage || fallback;
};

const DemandeMobilitePage = () => {
  const defaultCacheKey = useMemo(
    () => buildDemandesCacheKey(DEMANDES_MOBILITE_DEFAULT_FILTERS),
    []
  );
  const demandesCacheStoreRef = useRef(loadDemandesCacheStore());
  const rowsFromDefaultCache = demandesCacheStoreRef.current.entries?.[defaultCacheKey]?.rows;
  const [rows, setRows] = useState(Array.isArray(rowsFromDefaultCache) ? rowsFromDefaultCache : []);
  const rowsRef = useRef(rows);
  const demandesInFlightRef = useRef(new Map());
  const [employees, setEmployees] = useState([]);
  const [departements, setDepartements] = useState([]);
  const [postes, setPostes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [drawerMode, setDrawerMode] = useState(null);
  const [selectedDemande, setSelectedDemande] = useState(null);

  const [filters, setFilters] = useState(() => ({ ...DEMANDES_MOBILITE_DEFAULT_FILTERS }));

  const { setTitle, clearActions } = useHeader();
  const { dynamicStyles } = useOpen();

  const isDrawerOpen = drawerMode !== null;

  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const readCachedDemandes = useCallback((cacheKey) => {
    const entry = demandesCacheStoreRef.current.entries?.[cacheKey];
    if (!entry || !Array.isArray(entry.rows)) return null;

    return {
      rows: entry.rows,
      timestamp: Number(entry.timestamp) || 0,
      isFresh: Date.now() - (Number(entry.timestamp) || 0) < DEMANDES_MOBILITE_CACHE_TTL_MS,
    };
  }, []);

  const writeCachedDemandes = useCallback((cacheKey, nextRows) => {
    demandesCacheStoreRef.current = {
      entries: {
        ...demandesCacheStoreRef.current.entries,
        [cacheKey]: {
          rows: Array.isArray(nextRows) ? nextRows : [],
          timestamp: Date.now(),
        },
      },
    };

    persistDemandesCacheStore(demandesCacheStoreRef.current);
  }, []);

  const fetchDemandes = useCallback(async (activeFilters = DEMANDES_MOBILITE_DEFAULT_FILTERS, options = {}) => {
    const { forceRefresh = false } = options;
    const cacheKey = buildDemandesCacheKey(activeFilters);
    const cached = readCachedDemandes(cacheKey);
    const hasCachedRows = Boolean(cached);

    if (cached) {
      setRows(cached.rows);
      if (!forceRefresh && cached.isFresh) {
        setLoading(false);
        return cached.rows;
      }
    }

    const shouldShowBlockingLoading = !hasCachedRows && rowsRef.current.length === 0;
    if (shouldShowBlockingLoading) {
      setLoading(true);
    }

    if (!forceRefresh) {
      const inFlight = demandesInFlightRef.current.get(cacheKey);
      if (inFlight) {
        return inFlight;
      }
    }

    const requestPromise = (async () => {
      try {
        const params = Object.fromEntries(
          Object.entries(activeFilters).filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
        );

        let data = [];
        try {
          const response = await apiClient.get("/demandes-mobilite", { params, timeout: 30000 });
          data = Array.isArray(response.data) ? response.data : [];
        } catch {
          const fallbackResponse = await axios.get(`${API_BASE_URL}/demandes-mobilite`, {
            params,
            timeout: 30000,
            headers: { Accept: "application/json" },
          });
          data = Array.isArray(fallbackResponse.data) ? fallbackResponse.data : [];
        }

        setRows(data);
        writeCachedDemandes(cacheKey, data);
        try {
          sessionStorage.setItem(DEMANDES_MOBILITE_LEGACY_CACHE_KEY, JSON.stringify(data));
        } catch {
        }
        return data;
      } catch (error) {
        console.error("Erreur chargement demandes mobilité:", error);
        const statusCode = error?.response?.status;
        const statusText = statusCode ? ` (code ${statusCode})` : "";
        if (!cached) {
          Swal.fire("Erreur", `Impossible de charger les demandes de mobilité${statusText}.`, "error");
        }

        if (rowsRef.current.length === 0 && !cached) {
          setRows([]);
        }
        throw error;
      } finally {
        demandesInFlightRef.current.delete(cacheKey);
        if (shouldShowBlockingLoading) {
          setLoading(false);
        }
      }
    })();

    demandesInFlightRef.current.set(cacheKey, requestPromise);
    return requestPromise;
  }, [readCachedDemandes, writeCachedDemandes]);

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await apiClient.get("/employes/list");
      const data = Array.isArray(response.data) ? response.data : [];
      setEmployees(data);
    } catch (error) {
      console.error("Erreur chargement employés:", error);
      setEmployees([]);
    }
  }, []);

  const fetchDepartements = useCallback(async () => {
    try {
      const response = await apiClient.get("/departements");
      const data = Array.isArray(response.data) ? response.data : [];
      setDepartements(data);
    } catch (error) {
      console.error("Erreur chargement départements:", error);
      setDepartements([]);
    }
  }, []);

  const fetchPostes = useCallback(async () => {
    try {
      const response = await apiClient.get("/postes");
      const data = Array.isArray(response.data) ? response.data : [];
      setPostes(data);
    } catch (error) {
      console.error("Erreur chargement postes:", error);
      setPostes([]);
    }
  }, []);

  useEffect(() => {
    setTitle("Demandes de mobilité interne");
    return () => {
      clearActions();
    };
  }, [setTitle, clearActions]);

  useEffect(() => {
    fetchDemandes();
    fetchEmployees();
    fetchDepartements();
    fetchPostes();
  }, [fetchDemandes, fetchEmployees, fetchDepartements, fetchPostes]);

  const handleFiltersChange = useCallback((nextFilters) => {
    setFilters(nextFilters);
    fetchDemandes(nextFilters);
  }, [fetchDemandes]);

  const handleResetFilters = useCallback(() => {
    const reset = { ...DEMANDES_MOBILITE_DEFAULT_FILTERS };
    setFilters(reset);
    fetchDemandes(reset);
  }, [fetchDemandes]);

  const handleOpenAdd = useCallback(() => {
    setSelectedDemande(null);
    setDrawerMode("add");
  }, []);

  const handleOpenEdit = useCallback((row) => {
    setSelectedDemande(row);
    setDrawerMode("edit");
  }, []);

  const handleOpenView = useCallback((row) => {
    setSelectedDemande(row);
    setDrawerMode("view");
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedDemande(null);
    setDrawerMode(null);
  }, []);

  const submitDemande = useCallback(async (payload, mode, id) => {
    const config = { headers: { "Content-Type": "multipart/form-data" } };

    if (mode === "add") {
      await apiClient.post("/demandes-mobilite", payload, config);
      Swal.fire("Succès", "La demande de mobilité a été créée.", "success");
    } else {
      await apiClient.post(`/demandes-mobilite/${id}?_method=PUT`, payload, config);
      Swal.fire("Succès", "La demande de mobilité a été mise à jour.", "success");
    }

    await fetchDemandes(filters, { forceRefresh: true });
    handleCloseDrawer();
  }, [fetchDemandes, filters, handleCloseDrawer]);

  const handleCreate = useCallback(async (formData) => {
    try {
      await submitDemande(formData, "add");
    } catch (error) {
      Swal.fire("Erreur", extractApiError(error, "Création impossible."), "error");
    }
  }, [submitDemande]);

  const handleUpdate = useCallback(async (formData) => {
    if (!selectedDemande?.id) return;
    try {
      await submitDemande(formData, "edit", selectedDemande.id);
    } catch (error) {
      Swal.fire("Erreur", extractApiError(error, "Mise à jour impossible."), "error");
    }
  }, [selectedDemande, submitDemande]);

  const handleDelete = useCallback(async (row) => {
    const confirm = await Swal.fire({
      title: "Supprimer cette demande ?",
      text: "Cette action est irréversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    });

    if (!confirm.isConfirmed) return;

    try {
      await apiClient.delete(`/demandes-mobilite/${row.id}`);
      Swal.fire("Supprimée", "La demande a été supprimée.", "success");
      await fetchDemandes(filters, { forceRefresh: true });
      if (selectedDemande?.id === row.id) handleCloseDrawer();
    } catch (error) {
      Swal.fire("Erreur", extractApiError(error, "Suppression impossible."), "error");
    }
  }, [fetchDemandes, filters, selectedDemande, handleCloseDrawer]);

  const drawerTitle = useMemo(() => {
    if (drawerMode === "add") return "Ajouter une demande de mobilité";
    if (drawerMode === "edit") return "Modifier la demande de mobilité";
    if (drawerMode === "view") return "Détail de la demande";
    return "";
  }, [drawerMode]);

  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{ ...dynamicStyles, minHeight: "100vh", backgroundColor: "#ffffff" }}>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 0,
            mt: 12,
            minHeight: "calc(100vh - 130px)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
          <div style={{ padding: "8px", width: "100%" }}>
              <div
                className={`with-split-view ${isDrawerOpen ? "split-active" : ""}`}
                style={{
                  display: "flex",
                  gap: isDrawerOpen ? "10px" : "0",
                  width: "100%",
                  minHeight: "calc(100vh - 130px)",
                  overflowX: isDrawerOpen ? "auto" : "visible",
                  overflowY: "visible",
                  boxSizing: "border-box",
                }}
              >
                <style>
                  {`
                    @media (max-width: 1200px) {
                      .with-split-view.split-active {
                        flex-direction: column !important;
                        overflow-x: hidden !important;
                        overflow-y: auto !important;
                      }

                      .with-split-view.split-active > div {
                        min-width: 100% !important;
                        max-width: 100% !important;
                        flex: 0 0 auto !important;
                      }
                    }
                  `}
                </style>
                <div
                  style={{
                    flex: isDrawerOpen ? "0 0 58%" : "1 1 100%",
                    minWidth: 0,
                    transition: "all .25s ease",
                  }}
                >
                  <DemandeMobiliteTable
                    rows={rows}
                    loading={loading && rows.length === 0}
                    filters={filters}
                    departements={departements}
                    onFiltersChange={handleFiltersChange}
                    onResetFilters={handleResetFilters}
                    onAdd={handleOpenAdd}
                    onView={handleOpenView}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                  />
                </div>

                {isDrawerOpen && (
                  <div
                    className="cnss-form-section"
                    style={{
                      flex: "0 0 42%",
                      minWidth: 340,
                      maxWidth: "100%",
                      height: "calc(100vh - 170px)",
                      maxHeight: "calc(100vh - 170px)",
                      minHeight: 0,
                    }}
                  >
                    <div className="cnss-form-header d-flex justify-content-between align-items-center">
                      <h5 style={{ margin: 0 }}>{drawerTitle}</h5>
                      <button className="cnss-close-btn" onClick={handleCloseDrawer} type="button" aria-label="Fermer">
                        ×
                      </button>
                    </div>

                    <div className="cnss-form-body" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                      {drawerMode === "add" && (
                        <AddDemandeMobilite
                          employees={employees}
                          postes={postes}
                          departements={departements}
                          onSubmit={handleCreate}
                          onCancel={handleCloseDrawer}
                        />
                      )}

                      {drawerMode === "edit" && selectedDemande && (
                        <EditDemandeMobilite
                          demande={selectedDemande}
                          employees={employees}
                          postes={postes}
                          departements={departements}
                          onSubmit={handleUpdate}
                          onCancel={handleCloseDrawer}
                        />
                      )}

                      {drawerMode === "view" && selectedDemande && (
                        <ViewDemandeMobilite
                          demande={selectedDemande}
                          onClose={handleCloseDrawer}
                          onEdit={() => setDrawerMode("edit")}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
          </div>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default DemandeMobilitePage;
