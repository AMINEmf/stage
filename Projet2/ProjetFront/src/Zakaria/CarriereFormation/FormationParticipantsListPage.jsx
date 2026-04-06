import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, ThemeProvider, createTheme } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { X } from "lucide-react";
import Select from "react-select";
import Swal from "sweetalert2";
import { useHeader } from "../../Acceuil/HeaderContext";
import { useOpen } from "../../Acceuil/OpenProvider";
import apiClient from "../../services/apiClient";
import ExpandRTable from "../Employe/ExpandRTable";
import SectionTitle from "../CNSS/SectionTitle";
import "../Style.css";
import "./CareerTraining.css";

const normalizeValue = (v) => (v == null ? "" : String(v).toLowerCase().trim());

const formatDate = (value) => {
  if (!value) return "—";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString("fr-FR", { year: "numeric", month: "2-digit", day: "2-digit" });
  } catch {
    return value;
  }
};

const FormationParticipantsListPage = () => {
  const navigate = useNavigate();
  const { setTitle, clearActions, searchQuery } = useHeader();
  const { dynamicStyles } = useOpen();

  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedItems, setSelectedItems] = useState([]);

  // Selection & add participant
  const [selectedFormationId, setSelectedFormationId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTitle("Formation Participants");
    return () => clearActions();
  }, [setTitle, clearActions]);

  const fetchFormations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/formations");
      setFormations(res.data || []);
    } catch (err) {
      console.error("Erreur chargement formations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await apiClient.get("/employes/list");
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erreur chargement employés:", err);
    }
  }, []);

  useEffect(() => {
    fetchFormations();
    fetchEmployees();
  }, [fetchFormations, fetchEmployees]);

  // Get participants of selected formation to filter out already assigned employees
  const [existingParticipantIds, setExistingParticipantIds] = useState([]);

  const fetchExistingParticipants = useCallback(async (formationId) => {
    try {
      const res = await apiClient.get(`/formations/${formationId}/participants`);
      const ids = (Array.isArray(res.data) ? res.data : []).map((p) => p.employe_id);
      setExistingParticipantIds(ids);
    } catch {
      setExistingParticipantIds([]);
    }
  }, []);

  const employeeOptions = useMemo(() => {
    const existingSet = new Set(existingParticipantIds);
    const internalTrainerId = selectedFormation?.type === "Interne" ? Number(selectedFormation?.formateur_employe_id) : null;
    return employees
      .filter((emp) => {
        if (existingSet.has(emp.id)) return false;
        if (internalTrainerId && Number(emp.id) === internalTrainerId) return false;
        return true;
      })
      .map((emp) => ({
        value: emp.id,
        label: `${emp.nom} ${emp.prenom} (${emp.matricule || ""})`,
      }));
  }, [employees, existingParticipantIds, selectedFormation]);

  const selectedFormation = useMemo(
    () => formations.find((f) => f.id === selectedFormationId) || null,
    [formations, selectedFormationId]
  );

  const handleSelectFormation = (id) => {
    if (selectedFormationId === id) {
      setSelectedFormationId(null);
      setShowAddForm(false);
    } else {
      setSelectedFormationId(id);
      fetchExistingParticipants(id);
    }
  };

  const handleOpenAddForm = () => {
    if (!selectedFormationId) return;
    fetchExistingParticipants(selectedFormationId);
    setSelectedEmployees([]);
    setShowAddForm(true);
  };

  const handleCloseAddForm = () => {
    setShowAddForm(false);
    setSelectedEmployees([]);
  };

  const handleAddParticipants = async () => {
    if (!selectedFormationId || selectedEmployees.length === 0) return;
    setSubmitting(true);
    try {
      let addedCount = 0;
      for (const emp of selectedEmployees) {
        try {
          await apiClient.post(`/formations/${selectedFormationId}/participants`, {
            employe_id: emp.value,
            statut: "En attente",
          });
          addedCount++;
        } catch (err) {
          console.error(`Erreur ajout employé ${emp.value}:`, err);
        }
      }
      if (addedCount > 0) {
        Swal.fire({
          icon: "success",
          title: `${addedCount} participant(s) ajouté(s)`,
          timer: 1500,
          showConfirmButton: false,
        });
        fetchFormations();
        fetchExistingParticipants(selectedFormationId);
      }
      setSelectedEmployees([]);
      setShowAddForm(false);
    } catch (err) {
      Swal.fire({ icon: "error", title: "Erreur", text: "Erreur lors de l'ajout des participants." });
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo(
    () => [
      { key: "code", label: "Code" },
      { key: "titre", label: "Formation" },
      { key: "domaine", label: "Domaine" },
      {
        key: "type",
        label: "Type",
        render: (item) => {
          const value = item.type || "—";
          const cls = value === "Interne" ? "info" : "warning";
          return <span className={`career-badge ${cls}`}>{value}</span>;
        },
      },
      {
        key: "statut",
        label: "Statut",
        render: (item) => (
          <span
            className={`career-badge ${
              item.statut === "Termine" ? "success" : item.statut === "En cours" ? "info" : "warning"
            }`}
          >
            {item.statut || "—"}
          </span>
        ),
      },
      {
        key: "date_debut",
        label: "Date début",
        render: (item) => <span>{formatDate(item.date_debut)}</span>,
      },
      {
        key: "participants_count",
        label: "Participants",
        render: (item) => (
          <span
            style={{
              backgroundColor: item.participants_count > 0 ? "#dbeafe" : "#f1f5f9",
              color: item.participants_count > 0 ? "#1d4ed8" : "#64748b",
              padding: "2px 10px",
              borderRadius: "12px",
              fontWeight: 600,
              fontSize: "0.82rem",
            }}
          >
            {item.participants_count ?? 0}
          </span>
        ),
      },
    ],
    []
  );

  const searchTerm = searchQuery || "";

  const filteredRows = useMemo(() => {
    const s = normalizeValue(searchTerm);
    if (!s) return formations;
    return formations.filter((item) =>
      [item.code, item.titre, item.domaine, item.type, item.statut, item.organisme]
        .filter(Boolean)
        .some((v) => normalizeValue(v).includes(s))
    );
  }, [formations, searchTerm]);

  const highlightText = useCallback((text, term) => {
    if (!text || !term) return text;
    const str = String(text);
    const lower = term.toLowerCase();
    if (!str.toLowerCase().includes(lower)) return str;
    const parts = str.split(new RegExp(`(${term})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === lower ? (
        <mark key={i} style={{ backgroundColor: "yellow" }}>{part}</mark>
      ) : (
        part
      )
    );
  }, []);

  const renderCustomActions = useCallback(
    (item) => (
      <button
        className="btn btn-sm"
        title="Voir les participants"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/carrieres-formations/formations/${item.id}/participants`, {
            state: { formation: item },
          });
        }}
        style={{
          border: "none",
          backgroundColor: "transparent",
          cursor: "pointer",
          padding: "2px 6px",
        }}
      >
        <FontAwesomeIcon icon={faEye} style={{ color: "#2c767c", fontSize: "14px" }} />
      </button>
    ),
    [navigate]
  );

  const getRowStyle = useCallback(
    (item) => {
      if (item.id === selectedFormationId) {
        return { backgroundColor: "#e0f2fe", cursor: "pointer" };
      }
      return { cursor: "pointer" };
    },
    [selectedFormationId]
  );

  return (
    <ThemeProvider theme={createTheme()}>
      <Box sx={{ ...dynamicStyles, backgroundColor: "#ffffff", minHeight: "100vh" }}>
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
              gap: showAddForm ? "10px" : "0",
              padding: "8px",
              boxSizing: "border-box",
            }}
          >
            {/* ── LEFT: Formations table ── */}
            <div
              style={{
                flex: showAddForm ? "0 0 60%" : "1 1 100%",
                overflowY: "auto",
                transition: "flex 0.3s ease",
              }}
            >
              <div style={{ padding: "0 12px" }}>
                <div className="section-header mb-3" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <SectionTitle icon="fas fa-users" text="Formation Participants" />
                    <p className="section-description text-muted mb-0">
                      Cliquez sur une formation pour la sélectionner, puis ajoutez des participants
                    </p>
                  </div>
                  <button
                    className="cnss-btn-primary"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      opacity: selectedFormationId ? 1 : 0.5,
                      cursor: selectedFormationId ? "pointer" : "not-allowed",
                    }}
                    disabled={!selectedFormationId}
                    onClick={handleOpenAddForm}
                  >
                    <i className="fas fa-user-plus" style={{ fontSize: "13px" }} />
                    Ajouter Participants
                  </button>
                </div>

                {selectedFormation && (
                  <div
                    style={{
                      background: "#f0fdfa",
                      border: "1px solid #99f6e4",
                      borderRadius: "8px",
                      padding: "8px 14px",
                      marginBottom: "10px",
                      fontSize: "0.85rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <i className="fas fa-check-circle" style={{ color: "#14b8a6" }} />
                    <span>
                      Formation sélectionnée : <strong>{selectedFormation.titre}</strong> ({selectedFormation.code})
                      {" — "}
                      <span style={{ color: "#64748b" }}>
                        {selectedFormation.participants_count ?? 0} participant(s)
                      </span>
                    </span>
                  </div>
                )}

                <ExpandRTable
                  columns={columns}
                  data={filteredRows}
                  searchTerm={normalizeValue(searchTerm)}
                  highlightText={highlightText}
                  selectAll={selectedItems.length === filteredRows.length && filteredRows.length > 0}
                  selectedItems={selectedItems}
                  handleSelectAllChange={(checked) =>
                    setSelectedItems(checked ? filteredRows.map((r) => r.id) : [])
                  }
                  handleCheckboxChange={(id) =>
                    setSelectedItems((prev) =>
                      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                    )
                  }
                  handleDeleteSelected={() => {}}
                  rowsPerPage={itemsPerPage}
                  page={currentPage}
                  handleChangePage={(p) => setCurrentPage(p)}
                  handleChangeRowsPerPage={(e) => {
                    setItemsPerPage(parseInt(e.target.value, 10));
                    setCurrentPage(0);
                  }}
                  expandedRows={[]}
                  toggleRowExpansion={(id) => handleSelectFormation(id)}
                  renderExpandedRow={() => null}
                  renderCustomActions={renderCustomActions}
                  getRowStyle={getRowStyle}
                  loadingText={loading ? "Chargement des formations..." : undefined}
                />
              </div>
            </div>

            {/* ── RIGHT: Add participants panel ── */}
            {showAddForm && (
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
                    <h5>Ajouter des participants</h5>
                    <button className="cnss-close-btn" onClick={handleCloseAddForm} type="button">
                      <X size={20} />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="cnss-form-body" style={{ padding: "16px" }}>
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        marginBottom: "16px",
                        fontSize: "0.85rem",
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: "2px" }}>
                        {selectedFormation?.titre}
                      </div>
                      <div style={{ color: "#64748b" }}>
                        {selectedFormation?.code} · {selectedFormation?.domaine} · {selectedFormation?.type}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label" style={{ fontWeight: 600 }}>
                        Sélectionner les employés *
                      </label>
                      <Select
                        isMulti
                        options={employeeOptions}
                        value={selectedEmployees}
                        onChange={setSelectedEmployees}
                        placeholder="Rechercher des employés..."
                        isClearable
                        noOptionsMessage={() => "Aucun employé disponible"}
                        styles={{
                          control: (base) => ({ ...base, minHeight: "38px" }),
                          multiValue: (base) => ({
                            ...base,
                            backgroundColor: "#e0f2fe",
                            borderRadius: "4px",
                          }),
                          multiValueLabel: (base) => ({
                            ...base,
                            color: "#0369a1",
                            fontWeight: 500,
                          }),
                        }}
                      />
                      {selectedEmployees.length > 0 && (
                        <div style={{ marginTop: "6px", fontSize: "0.8rem", color: "#64748b" }}>
                          {selectedEmployees.length} employé(s) sélectionné(s)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="cnss-form-footer">
                    <button type="button" className="cnss-btn-secondary" onClick={handleCloseAddForm}>
                      Annuler
                    </button>
                    <button
                      type="button"
                      className="cnss-btn-primary"
                      onClick={handleAddParticipants}
                      disabled={selectedEmployees.length === 0 || submitting}
                    >
                      {submitting ? "Ajout en cours..." : `Ajouter (${selectedEmployees.length})`}
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

export default FormationParticipantsListPage;
