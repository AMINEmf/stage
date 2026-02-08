import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Button, Table } from "react-bootstrap";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEdit, faTrash } from "@fortawesome/free-solid-svg-icons";
import AddCnssOperation from "./AddCnssOperation";
import ExpandRTable from "../Employe/ExpandRTable";
import "../Employe/AddEmp.css";

const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : "http://127.0.0.1:8000";

const formatCurrency = (value) => {
  const parsedValue = Number(value ?? 0);
  if (!Number.isFinite(parsedValue)) return "-";
  return `${parsedValue.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MAD`;
};

function DossierCNSSDetails({ employeId, onClose, onDocumentsUpdated }) {
  const [operations, setOperations] = useState([]);
  const [operationsLoading, setOperationsLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [operationDocuments, setOperationDocuments] = useState([]);
  const [activeOperationId, setActiveOperationId] = useState(null);
  const documentsLoadingTimerRef = useRef(null);
  const documentsRequestIdRef = useRef(0);
  const [operationDrawerMode, setOperationDrawerMode] = useState(null);
  const [selectedOperation, setSelectedOperation] = useState(null);
  const [operationsPage, setOperationsPage] = useState(0);
  const [operationsRowsPerPage, setOperationsRowsPerPage] = useState(5);
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);

  const fetchUserAccess = useCallback(async () => {
    try {
      const resp = await axios.get(`${API_BASE}/api/user`, { withCredentials: true });
      const rolesData = Array.isArray(resp.data) ? resp.data[0]?.roles : resp.data?.roles;
      const permissionsData = rolesData && rolesData[0]?.permissions ? rolesData[0].permissions.map((p) => p.name) : [];
      const roleNames = Array.isArray(rolesData) ? rolesData.map((r) => r.name) : [];
      setPermissions(permissionsData);
      setRoles(roleNames);
    } catch (e) {
      setPermissions([]);
      setRoles([]);
    }
  }, []);

  const canManageDocuments = useMemo(() => {
    const normalizedRoles = roles.map((role) => String(role).toLowerCase());
    if (normalizedRoles.includes("admin") || normalizedRoles.includes("hr") || normalizedRoles.includes("rh")) {
      return true;
    }
    if (permissions.includes("update_employes") || permissions.includes("delete_employes")) {
      return true;
    }
    return false;
  }, [permissions, roles]);

  const canEditOperations = useMemo(() => {
    const normalizedRoles = roles.map((role) => String(role).toLowerCase());
    if (normalizedRoles.includes("admin") || normalizedRoles.includes("hr") || normalizedRoles.includes("rh")) {
      return true;
    }
    return permissions.includes("update_employes");
  }, [permissions, roles]);

  const canDeleteOperations = useMemo(() => {
    const normalizedRoles = roles.map((role) => String(role).toLowerCase());
    if (normalizedRoles.includes("admin") || normalizedRoles.includes("hr") || normalizedRoles.includes("rh")) {
      return true;
    }
    return permissions.includes("delete_employes");
  }, [permissions, roles]);

  const fetchOperations = useCallback(async () => {
    if (!employeId) {
      setOperations([]);
      return;
    }

    setOperationsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/api/cnss/dossiers/${employeId}/operations`);
      const payload = response.data?.data ?? response.data;
      setOperations(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error("Erreur lors du chargement des operations CNSS:", error);
      setOperations([]);
    } finally {
      setOperationsLoading(false);
    }
  }, [employeId]);

  const fetchOperationDocuments = useCallback(async (operationId) => {
    if (!operationId) {
      setOperationDocuments([]);
      return;
    }

    documentsRequestIdRef.current += 1;
    const requestId = documentsRequestIdRef.current;

    if (documentsLoadingTimerRef.current) {
      clearTimeout(documentsLoadingTimerRef.current);
    }

    documentsLoadingTimerRef.current = setTimeout(() => {
      if (documentsRequestIdRef.current === requestId) {
        setDocumentsLoading(true);
        setOperationDocuments([]);
      }
    }, 250);

    try {
      const response = await axios.get(`${API_BASE}/api/cnss/operations/${operationId}`);
      const payload = response.data?.data ?? response.data;
      const docsPayload = payload?.documents?.data ?? payload?.documents ?? [];
      if (documentsRequestIdRef.current === requestId) {
        setOperationDocuments(Array.isArray(docsPayload) ? docsPayload : []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des documents de l'operation:", error);
      if (documentsRequestIdRef.current === requestId) {
        setOperationDocuments([]);
      }
    } finally {
      if (documentsLoadingTimerRef.current) {
        clearTimeout(documentsLoadingTimerRef.current);
        documentsLoadingTimerRef.current = null;
      }
      if (documentsRequestIdRef.current === requestId) {
        setDocumentsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchUserAccess();
  }, [fetchUserAccess]);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  useEffect(() => {
    setActiveOperationId(null);
    setOperationDocuments([]);
  }, [employeId]);

  const handleDownload = useCallback(async (doc) => {
    try {
      const response = await axios.get(`${API_BASE}/api/cnss/documents/${doc.id}/download`, {
        responseType: "blob",
      });

      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: doc.mime_type }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", doc.original_name || "document");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Erreur lors du telechargement:", error);
      Swal.fire("Erreur", "Impossible de telecharger le document.", "error");
    }
  }, []);

  const handleDelete = useCallback(
    async (doc) => {
      const result = await Swal.fire({
        title: "Etes-vous sur ?",
        text: "Ce document sera supprime.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Oui, supprimer",
        cancelButtonText: "Annuler",
      });

      if (!result.isConfirmed) return;

      try {
        await axios.delete(`${API_BASE}/api/cnss/documents/${doc.id}`);
        Swal.fire("Supprime", "Le document a ete supprime.", "success");
        await fetchOperations();
        await fetchOperationDocuments(activeOperationId);
        if (onDocumentsUpdated) onDocumentsUpdated();
      } catch (error) {
        console.error("Erreur lors de la suppression du document:", error);
        Swal.fire("Erreur", "Impossible de supprimer le document.", "error");
      }
    },
    [activeOperationId, fetchOperationDocuments, fetchOperations, onDocumentsUpdated]
  );

  const typeOptions = useMemo(() => {
    const types = operations.map((op) => op.type_operation).filter(Boolean);
    const unique = Array.from(new Set(types));
    return unique.map((type) => ({ label: type, value: type }));
  }, [operations]);

  const operationColumns = useMemo(
    () => [
      {
        key: "date_operation",
        label: "Date",
        render: (item) => <span>{item.date_operation || "-"}</span>,
      },
      {
        key: "type_operation",
        label: "Type",
        render: (item) => <span>{item.type_operation || "-"}</span>,
      },
      {
        key: "statut",
        label: "Statut",
        render: (item) => {
          const status = item.statut || "EN_COURS";
          const badgeClass =
            status === "TERMINEE"
              ? "bg-success"
              : status === "ANNULEE"
              ? "bg-danger"
              : "bg-secondary";
          return <span className={`badge ${badgeClass}`}>{status}</span>;
        },
      },
      {
        key: "reference",
        label: "Référence",
        render: (item) => <span>{item.reference || "-"}</span>,
      },
      {
        key: "montant",
        label: "Montant",
        render: (item) => <span>{formatCurrency(item.montant)}</span>,
      },
      {
        key: "documents_count",
        label: "Documents",
        render: (item) => {
          const count = Number(item.documents_count ?? 0);
          return (
            <span>
              {count} document{count > 1 ? "s" : ""}
            </span>
          );
        },
      },
    ],
    []
  );

  const handleOpenOperation = useCallback(
    (operation, mode) => {
      setSelectedOperation(operation || null);
      setOperationDrawerMode(mode);
      if (operation?.id) {
        setActiveOperationId(operation.id);
        fetchOperationDocuments(operation.id);
      }
    },
    [fetchOperationDocuments]
  );

  const handleCloseOperationDrawer = useCallback(() => {
    setSelectedOperation(null);
    setOperationDrawerMode(null);
  }, []);

  const handleDeleteOperation = useCallback(
    async (operation) => {
      if (!canDeleteOperations || operation.statut !== "EN_COURS") {
        return;
      }

      const result = await Swal.fire({
        title: "Etes-vous sur ?",
        text: "Cette operation sera supprimee.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Oui, supprimer",
        cancelButtonText: "Annuler",
      });

      if (!result.isConfirmed) return;

      try {
        await axios.delete(`${API_BASE}/api/cnss/operations/${operation.id}`);
        Swal.fire("Supprime", "L'operation a ete supprimee.", "success");
        await fetchOperations();
      } catch (error) {
        console.error("Erreur lors de la suppression de l'operation:", error);
        Swal.fire("Erreur", "Impossible de supprimer l'operation.", "error");
      }
    },
    [canDeleteOperations, fetchOperations]
  );

  const handleOperationsPageChange = useCallback((newPage) => {
    setOperationsPage(newPage);
  }, []);

  const handleOperationsRowsPerPageChange = useCallback((event) => {
    setOperationsRowsPerPage(parseInt(event.target.value, 10));
    setOperationsPage(0);
  }, []);

  return (
    <>
      <div className="addemp-overlay">
        <div className="addper">
          <div className="employee-body" style={{ margin: 0, padding: 0, overflowX: "hidden" }}>
            <div style={{ position: "relative" }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  position: "fixed",
                  top: "10%",
                  right: "25px",
                  background: "transparent",
                  border: "none",
                  fontSize: "2rem",
                  color: "#4b5563",
                  cursor: "pointer",
                  zIndex: 9999,
                }}
                aria-label="Fermer le dossier"
              >
                &times;
              </button>

              <div style={{ padding: "20px" }}>
                <h3
                  className="mb-4"
                  style={{
                    borderBottom: "2px solid #e9ecef",
                    paddingBottom: "10px",
                    color: "#2c3e50",
                    fontWeight: "600",
                  }}
                >
                  Dossier CNSS
                </h3>

                <>
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h5 className="mb-0">Documents</h5>
                    </div>

                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Fichier</th>
                            <th>Type</th>
                            <th>Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {documentsLoading ? (
                            <tr>
                              <td colSpan={4} className="text-center text-muted">
                                Chargement des documents…
                              </td>
                            </tr>
                          ) : operationDocuments.length > 0 ? (
                            operationDocuments.map((doc) => (
                              <tr key={doc.id}>
                                <td>{doc.original_name || "-"}</td>
                                <td>{doc.document_type || "-"}</td>
                                <td>{doc.created_at || "-"}</td>
                                <td>
                                  <div className="d-flex gap-2">
                                    <Button variant="outline-secondary" size="sm" onClick={() => handleDownload(doc)}>
                                      Telecharger
                                    </Button>
                                    <Button
                                      variant="outline-danger"
                                      size="sm"
                                      onClick={() => handleDelete(doc)}
                                      disabled={!canManageDocuments}
                                    >
                                      Supprimer
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="text-center text-muted">
                                {activeOperationId ? "Aucun document pour cette opération." : "Sélectionnez une opération."}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </div>

                  <div className="mt-4">
                      <div className="section-header mb-3">
                        <div className="d-flex align-items-center justify-content-between" style={{ gap: 24 }}>
                          <div>
                            <span className="section-title mb-1">
                              <i className="fas fa-id-card me-2"></i>
                              Opérations CNSS
                            </span>
                          </div>
                        </div>
                      </div>

                      <ExpandRTable
                        columns={operationColumns}
                        data={operations}
                        loading={operationsLoading}
                        loadingText="Chargement des opérations CNSS..."
                        searchTerm=""
                        highlightText={(text) => text}
                        selectAll={false}
                        selectedItems={[]}
                        handleSelectAllChange={() => {}}
                        handleCheckboxChange={() => {}}
                        rowsPerPage={operationsRowsPerPage}
                        page={operationsPage}
                        handleChangePage={handleOperationsPageChange}
                        handleChangeRowsPerPage={handleOperationsRowsPerPageChange}
                        expandedRows={[]}
                        toggleRowExpansion={() => {}}
                        renderExpandedRow={() => null}
                        renderCustomActions={(item) => {
                          const isEditable = item.statut === "EN_COURS" && canEditOperations;
                          const isDeletable = item.statut === "EN_COURS" && canDeleteOperations;

                          return (
                            <>
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleOpenOperation(item, "view");
                                }}
                                aria-label="Voir détails"
                                title="Voir détails"
                                style={{
                                  border: "none",
                                  backgroundColor: "transparent",
                                  cursor: "pointer",
                                }}
                              >
                                <FontAwesomeIcon icon={faEye} style={{ color: "#007bff", fontSize: "14px" }} />
                              </button>
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (!isEditable) return;
                                  handleOpenOperation(item, "edit");
                                }}
                                aria-label="Modifier"
                                title="Modifier"
                                className={!isEditable ? "disabled-btn" : ""}
                                style={{
                                  border: "none",
                                  backgroundColor: "transparent",
                                  cursor: isEditable ? "pointer" : "not-allowed",
                                  opacity: isEditable ? 1 : 0.5,
                                }}
                              >
                                <FontAwesomeIcon icon={faEdit} style={{ color: "#007bff", fontSize: "14px" }} />
                              </button>
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  if (!isDeletable) return;
                                  handleDeleteOperation(item);
                                }}
                                aria-label="Supprimer"
                                title="Supprimer"
                                className={!isDeletable ? "disabled-btn" : ""}
                                style={{
                                  border: "none",
                                  backgroundColor: "transparent",
                                  cursor: isDeletable ? "pointer" : "not-allowed",
                                  opacity: isDeletable ? 1 : 0.5,
                                }}
                              >
                                <FontAwesomeIcon icon={faTrash} style={{ color: "#ff0000", fontSize: "14px" }} />
                              </button>
                            </>
                          );
                        }}
                        canEdit={false}
                        canDelete={false}
                        canBulkDelete={false}
                      />
                    </div>
                </>
              </div>
            </div>
          </div>
        </div>
      </div>

      {operationDrawerMode && (
        <AddCnssOperation
          employeId={employeId}
          operation={selectedOperation}
          mode={operationDrawerMode}
          typeOptions={typeOptions}
          onClose={handleCloseOperationDrawer}
          onSaved={async () => {
            handleCloseOperationDrawer();
            await fetchOperations();
            if (activeOperationId) {
              await fetchOperationDocuments(activeOperationId);
            }
          }}
        />
      )}
    </>
  );
}

export default DossierCNSSDetails;
