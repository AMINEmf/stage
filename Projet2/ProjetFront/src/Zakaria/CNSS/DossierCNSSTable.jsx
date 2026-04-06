import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import axios from "axios";
import { Button, Dropdown, Form } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClose, faEye, faFilter, faSliders } from "@fortawesome/free-solid-svg-icons";
import { FaPlusCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import ExpandRTable from "../Shared/ExpandRTable";
import DossierCNSSDetails from "./DossierCNSSDetails";
import AddCnssOperation from "./AddCnssOperation";
import "../Style.css";
import SectionTitle from "./SectionTitle";

const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : "http://127.0.0.1:8000";

const normalizeValue = (value) => (value == null ? "" : String(value).toLowerCase().trim());

const StatusChip = ({ status }) => {
  const normalized = String(status || "").toUpperCase();
  let color = "#64748b";

  if (["ACTIF", "ACTIVE", "PAYE", "TERMINEE"].includes(normalized)) {
    color = "#4caf50";
  } else if (["EN_COURS", "EN_ATTENTE", "DECLARE"].includes(normalized)) {
    color = "#ff9800";
  } else if (["RESILIE", "REFUSÉE", "ANNULÉE", "ERREUR", "SUSPENDU", "INACTIF"].includes(normalized)) {
    color = "#f44336";
  }

  return (
    <span
      style={{
        backgroundColor: `${color}15`,
        color: color,
        padding: "4px 8px",
        borderRadius: "6px",
        fontSize: "0.65rem",
        fontWeight: 700,
        display: "inline-block",
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        letterSpacing: "0.3px"
      }}
    >
      {status || "-"}
    </span>
  );
};

const DossierCNSSTable = forwardRef((props, ref) => {
  const {
    globalSearch,
    filtersVisible,
    handleFiltersToggle,
    departementId,
    includeSubDepartments,
    getSubDepartmentIds,
    departements,
  } = props;

  const [dossiers, setDossiers] = useState([]);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showAddOperation, setShowAddOperation] = useState(false);
  const [addOperationEmployeId, setAddOperationEmployeId] = useState(null);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    filters: [
      {
        key: "cnss_status",
        label: "Statut CNSS",
        type: "select",
        value: "",
        options: [
          { label: "Actif", value: "Actif" },
          { label: "Inactif", value: "Inactif" },
          { label: "Aucun", value: "Aucun" },
        ],
        placeholder: "Tous",
      },
    ],
  });

  // Resizing state
  const [drawerWidth, setDrawerWidth] = useState(45); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);
  const dossiersCacheRef = useRef(new Map());

  const startResizing = useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e) => {
    if (isResizing && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((containerRect.right - e.clientX) / containerRect.width) * 100;
      if (newWidth > 20 && newWidth < 80) {
        setDrawerWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    } else {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  const isDetailsOpen = Boolean(selectedDossier);
  const isAnyFormOpen = isDetailsOpen || showAddOperation;
  const hasSelectedDepartement = Boolean(departementId);

  const fetchDossiers = useCallback(async (forceRefresh = false) => {
    if (!departementId) {
      setDossiers([]);
      setIsTableLoading(false);
      return;
    }

    const departementIds = includeSubDepartments && getSubDepartmentIds
      ? getSubDepartmentIds(departements || [], departementId)
      : [departementId];
    const normalizedIds = Array.from(new Set(departementIds.map((id) => String(id)))).sort();
    const cacheKey = `cnss_dossiers_${includeSubDepartments ? "sub" : "dep"}_${normalizedIds.join("_")}`;

    if (!forceRefresh) {
      const inMemory = dossiersCacheRef.current.get(cacheKey);
      if (Array.isArray(inMemory)) {
        setDossiers(inMemory);
        setIsTableLoading(false);
        return;
      }

      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            dossiersCacheRef.current.set(cacheKey, parsed);
            setDossiers(parsed);
            setIsTableLoading(false);
            return;
          }
        } catch {
          // ignore malformed cache and continue with network fetch
        }
      }
    }

    setIsTableLoading(true);
    try {

      const response = await axios.get(`${API_BASE}/api/cnss/dossiers`, {
        params: {
          departement_id: departementId || undefined,
          departement_ids: departementIds,
          per_page: 500,
        },
      });

      const payload = response.data;
      const list = Array.isArray(payload) ? payload : payload?.data || [];
      setDossiers(list);
      dossiersCacheRef.current.set(cacheKey, list);
      localStorage.setItem(cacheKey, JSON.stringify(list));
    } catch (error) {
      console.error("Erreur lors du chargement des dossiers CNSS:", error);
    } finally {
      setIsTableLoading(false);
    }
  }, [departementId, includeSubDepartments, getSubDepartmentIds, departements]);

  useEffect(() => {
    fetchDossiers();
  }, [fetchDossiers]);

  useEffect(() => {
    setSelectedDossier(null);
    setSelectedItems([]);
  }, [departementId]);

  const mappedDossiers = useMemo(
    () =>
      dossiers.map((dossier) => {
        const fullName = `${dossier.nom || ""} ${dossier.prenom || ""}`.trim();

        return {
          ...dossier,
          employe_label: fullName || "-",
          numero_adherent: dossier.numero_adherent || "-",
          operations_count: Number(dossier.operations_count ?? 0),
        };
      }),
    [dossiers]
  );

  const filteredDossiers = useMemo(() => {
    const search = normalizeValue(globalSearch);
    const statusFilter = filterOptions.filters.find((f) => f.key === "cnss_status");

    return mappedDossiers.filter((item) => {
      const matchesSearch =
        !search ||
        normalizeValue(item.employe_label).includes(search) ||
        normalizeValue(item.matricule).includes(search);

      const matchesStatus =
        !statusFilter?.value ||
        normalizeValue(item.cnss_affiliation_status) === normalizeValue(statusFilter.value);

      return matchesSearch && matchesStatus;
    });
  }, [mappedDossiers, globalSearch, filterOptions.filters]);

  useEffect(() => {
    if (selectedItems.length === 0) return;
    const availableIds = new Set(filteredDossiers.map((item) => item.id));
    setSelectedItems((prev) => prev.filter((id) => availableIds.has(id)));
  }, [filteredDossiers, selectedItems.length]);

  const allColumns = useMemo(
    () => [
      { key: "matricule", label: "Matricule" },
      {
        key: "numero_adherent",
        label: "N Adherent",
        render: (item) => <span>{item.numero_adherent || "-"}</span>,
      },
      {
        key: "statut",
        label: "Statut",
        render: (item) => <StatusChip status={item.cnss_affiliation_status} />,
      },
      {
        key: "employe_label",
        label: "Nom",
        render: (item) => <span>{item.employe_label}</span>,
      },
      {
        key: "operations_count",
        label: "nombre operation",
        render: (item) => <span>{Number(item.operations_count ?? 0)}</span>,
      },
    ],
    []
  );

  const visibleColumns = useMemo(() => {
    return allColumns.filter((column) => columnVisibility[column.key]);
  }, [allColumns, columnVisibility]);

  useEffect(() => {
    const defaults = {};
    allColumns.forEach((column) => {
      defaults[column.key] = true;
    });

    const saved = localStorage.getItem("cnssDossiersColumnVisibility");
    if (saved) {
      const parsed = JSON.parse(saved);
      const merged = { ...defaults, ...parsed };
      setColumnVisibility(merged);
      localStorage.setItem("cnssDossiersColumnVisibility", JSON.stringify(merged));
      return;
    }

    setColumnVisibility(defaults);
    localStorage.setItem("cnssDossiersColumnVisibility", JSON.stringify(defaults));
  }, [allColumns]);

  const handleColumnsChange = useCallback((column) => {
    setColumnVisibility((prev) => {
      const updated = { ...prev, [column]: !prev[column] };
      localStorage.setItem("cnssDossiersColumnVisibility", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleChangePage = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setItemsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0);
  }, []);

  const handleSelectAllChange = useCallback(
    (event, checked) => {
      const isChecked = typeof checked === "boolean" ? checked : event?.target?.checked;
      if (isChecked) {
        setSelectedItems(filteredDossiers.map((item) => item.id));
      } else {
        setSelectedItems([]);
      }
    },
    [filteredDossiers]
  );

  const handleCheckboxChange = useCallback((id) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  }, []);

  const handleOpenAddOperation = useCallback(() => {
    if (!hasSelectedDepartement) {
      return;
    }
    if (selectedItems.length === 0) {
      Swal.fire("Attention", "Sélectionnez un employé", "warning");
      return;
    }
    if (selectedItems.length > 1) {
      Swal.fire("Attention", "Sélectionnez un seul employé", "warning");
      return;
    }
    setAddOperationEmployeId(selectedItems[0]);
    setShowAddOperation(true);
  }, [hasSelectedDepartement, selectedItems]);

  const handleCloseAddOperation = useCallback(() => {
    setShowAddOperation(false);
    setAddOperationEmployeId(null);
  }, []);

  const canOpenAddOperation = hasSelectedDepartement && selectedItems.length === 1;

  const handleFilterChange = useCallback((key, value) => {
    setFilterOptions((prev) => ({
      ...prev,
      filters: prev.filters.map((filter) => (filter.key === key ? { ...filter, value } : filter)),
    }));
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;

    const result = await Swal.fire({
      title: "Êtes-vous sûr?",
      text: `Vous allez supprimer ${selectedItems.length} opération(s)!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, supprimer!",
      cancelButtonText: "Annuler",
    });

    if (result.isConfirmed) {
      try {
        await Promise.all(
          selectedItems.map((id) => axios.delete(`${API_BASE}/api/cnss/dossiers/${id}`))
        );

        setSelectedItems([]);
        await fetchDossiers(true);

        Swal.fire("Supprimés!", "Les opérations ont été supprimées.", "success");
      } catch (error) {
        console.error("Error deleting selected dossiers:", error);
        Swal.fire("Erreur!", "Une erreur est survenue lors de la suppression.", "error");
      }
    }
  }, [selectedItems, fetchDossiers]);

  const highlightText = useCallback((text, searchTerm) => {
    if (!text || !searchTerm) return text;

    const textStr = String(text);
    const searchTermLower = searchTerm.toLowerCase();

    if (!textStr.toLowerCase().includes(searchTermLower)) return textStr;

    const parts = textStr.split(new RegExp(`(${searchTerm})`, "gi"));
    return parts.map((part, index) =>
      part.toLowerCase() === searchTermLower ? (
        <mark key={`${part}-${index}`} style={{ backgroundColor: "yellow" }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, []);

  const exportToPDF = useCallback(() => {
    const doc = new jsPDF();
    const tableColumns = allColumns.filter((column) => columnVisibility[column.key]).map((column) => column.label);
    const tableRows = filteredDossiers.map((item) =>
      allColumns
        .filter((column) => columnVisibility[column.key])
        .map((column) => item[column.key])
    );

    doc.setFontSize(18);
    doc.text("Gestion des opérations CNSS", 14, 22);
    doc.setFontSize(11);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: 35,
    });
    doc.save("cnss_operations.pdf");
  }, [allColumns, columnVisibility, filteredDossiers]);

  const exportToExcel = useCallback(() => {
    const worksheetData = filteredDossiers.map((item) => {
      const row = {};
      allColumns.forEach((column) => {
        if (!columnVisibility[column.key]) return;
        row[column.label] = item[column.key];
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Opérations CNSS");
    XLSX.writeFile(wb, "cnss_operations.xlsx");
  }, [allColumns, columnVisibility, filteredDossiers]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableColumns = allColumns.filter((column) => columnVisibility[column.key]).map((column) => column.label);
    const tableRows = filteredDossiers.map((item) =>
      allColumns
        .filter((column) => columnVisibility[column.key])
        .map((column) => item[column.key])
    );

    const tableHtml = `
      <html>
        <head>
          <title>Gestion des opérations CNSS</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Gestion des opérations CNSS</h1>
          <table>
            <thead>
              <tr>${tableColumns.map((column) => `<th>${column}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${tableRows.map((row) => `<tr>${row.map((cell) => `<td>${cell ?? ""}</td>`).join("")}</tr>`).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(tableHtml);
    printWindow.document.close();
    printWindow.print();
  }, [allColumns, columnVisibility, filteredDossiers]);

  useImperativeHandle(
    ref,
    () => ({
      exportToPDF,
      exportToExcel,
      handlePrint,
    }),
    [exportToPDF, exportToExcel, handlePrint]
  );

  const iconButtonStyle = {
    backgroundColor: "#f9fafb",
    border: "0.0625rem solid #ccc",
    borderRadius: "0.3125rem",
    padding: "0.8rem 1rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "2.5rem",
    minHeight: "2.5rem",
  };

  const CustomMenu = React.forwardRef(({ className, "aria-labelledby": labeledBy }, customRef) => (
    <div
      ref={customRef}
      className={className}
      aria-labelledby={labeledBy}
      style={{
        padding: "0.625rem",
        backgroundColor: "white",
        border: "0.0625rem solid #ccc",
        borderRadius: "0.3125rem",
        maxHeight: "max(300px, 40vh)",
        maxWidth: "90vw",
        overflowY: "auto",
        boxSizing: "border-box"
      }}
    >
      <Form onClick={(event) => event.stopPropagation()}>
        {allColumns.map((column) => (
          <Form.Check
            key={column.key}
            type="checkbox"
            id={`dossier-column-${column.key}`}
            label={column.label}
            checked={columnVisibility[column.key]}
            onChange={() => handleColumnsChange(column.key)}
          />
        ))}
      </Form>
    </div>
  ));

  return (
    <div
      style={{
        position: "relative",
        left: "-2%",
        top: "0",
        minHeight: "calc(100vh - 160px)",
      }}
      className="container_employee"
    >
      <div
        ref={containerRef}
        className={`with-split-view ${isAnyFormOpen ? "split-active" : ""}`}
        style={{
          width: "100%",
          height: "calc(100vh - 130px)",
          display: "flex",
          gap: "0",
          overflowX: isAnyFormOpen ? "auto" : "visible",
          overflowY: "hidden",
          boxSizing: "border-box"
        }}
      >
        {/* CSS Override for Split View */}
        <style>
          {`
        /* Responsive Split View for Zoom */
        @media (max-width: 1100px) {
          .with-split-view.split-active {
            flex-direction: column !important;
            overflow-y: auto !important;
            overflow-x: hidden !important;
          }
          .with-split-view.split-active > div {
            min-width: 100% !important;
            max-width: 100% !important;
            flex: 0 0 auto !important;
            height: auto !important;
          }
          .with-split-view.split-active .split-view-drawer {
            border-top: 1px solid #eef2f5;
            box-shadow: 0 -0.25rem 0.9375rem rgba(0,0,0,0.05);
            min-height: 500px;
          }
        }

        /* Ensure smooth scrolling for split view */
        .with-split-view::-webkit-scrollbar {
          height: 6px;
        }
        .with-split-view::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 3px;
        }
      `}
        </style>

        {/* Left Pane: Table & Filters */}
        <div
          style={{
            flexGrow: isAnyFormOpen ? 0 : 1,
            flexShrink: isAnyFormOpen ? 0 : 1,
            flexBasis: isAnyFormOpen ? `${100 - drawerWidth}%` : "100%",
            borderRight: isAnyFormOpen && !isResizing ? "0.125rem solid #eef2f5" : "none",
            transition: isResizing ? "none" : "flex-basis 0.35s cubic-bezier(0.4, 0, 0.2, 1), flex-grow 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
            paddingRight: isAnyFormOpen ? "0.625rem" : "0",
            minWidth: "0",
            boxSizing: "border-box",
            height: "100%",
            overflowX: "hidden",
            overflowY: "auto"
          }}
        >
          <div className="mt-4">
            <div className="section-header mb-3">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  alignItems: "center",
                  columnGap: "1.5rem",
                  rowGap: "0.75rem",
                }}
              >
                <div>
                  <SectionTitle icon="fas fa-id-card" text="Gestion des opérations CNSS" />
                  {!isDetailsOpen && (
                    <p className="section-description text-muted mb-0">
                      {filteredDossiers.length} opération{filteredDossiers.length > 1 ? "s" : ""} affichée
                      {filteredDossiers.length > 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", gap: "12px", justifySelf: "end", alignItems: "center" }}>
                  {!isDetailsOpen && (
                    <>
                      <Button
                        onClick={handleOpenAddOperation}
                        className={`btn btn-outline-primary d-flex align-items-center ${!canOpenAddOperation ? "disabled-btn" : ""}`}
                        disabled={!canOpenAddOperation}
                        size="sm"
                        style={{ marginRight: "30px !important", width: "160px" }}
                      >
                        <FaPlusCircle className="me-2" />
                        Ajouter une Opération
                      </Button>

                      <FontAwesomeIcon
                        onClick={() => handleFiltersToggle && handleFiltersToggle(!filtersVisible)}
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
                      <Dropdown show={showDropdown} onToggle={(isOpen) => setShowDropdown(isOpen)}>
                        <Dropdown.Toggle
                          as="button"
                          id="dropdown-visibility-dossiers"
                          title="Visibilite Colonnes"
                          style={iconButtonStyle}
                        >
                          <FontAwesomeIcon icon={faSliders} style={{ width: 18, height: 18, color: "#4b5563" }} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu as={CustomMenu} />
                      </Dropdown>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {filtersVisible && !isDetailsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="filters-container"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  padding: "16px 20px",
                  minHeight: 0,
                }}
              >
                <div
                  className="filters-icon-section"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    justifyContent: "center",
                    marginLeft: "-8px",
                    marginRight: "14%",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a90a4" strokeWidth="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                  </svg>
                  <span className="filters-title">Filtres</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1px",
                    flexWrap: "wrap",
                    justifyContent: "center",
                    marginLeft: "10.2%",
                  }}
                >
                  {filterOptions.filters.map((filter) => (
                    <div key={filter.key} style={{ display: "flex", alignItems: "center", margin: 0, marginRight: "46px" }}>
                      <label
                        className="filter-label"
                        style={{
                          fontSize: "0.9rem",
                          margin: 0,
                          marginRight: "-44px",
                          whiteSpace: "nowrap",
                          minWidth: "auto",
                          fontWeight: 600,
                          color: "#2c3e50",
                        }}
                      >
                        {filter.label}
                      </label>

                      <select
                        value={filter.value ?? ""}
                        onChange={(event) => handleFilterChange(filter.key, event.target.value || "")}
                        className="filter-input"
                        style={{
                          minWidth: "7rem",
                          maxWidth: "100%",
                          height: "2rem",
                          fontSize: "0.9rem",
                          padding: "0.125rem 0.375rem",
                          borderRadius: "0.375rem",
                        }}
                      >
                        <option value="">{filter.placeholder}</option>
                        {filter.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ExpandRTable
            columns={visibleColumns}
            data={filteredDossiers}
            loading={isTableLoading}
            searchTerm={normalizeValue(globalSearch)}
            highlightText={highlightText}
            selectAll={selectedItems.length === filteredDossiers.length && filteredDossiers.length > 0}
            selectedItems={selectedItems}
            handleSelectAllChange={handleSelectAllChange}
            handleCheckboxChange={handleCheckboxChange}
            rowsPerPage={itemsPerPage}
            page={currentPage}
            handleChangePage={handleChangePage}
            handleChangeRowsPerPage={handleChangeRowsPerPage}
            expandedRows={[]}
            toggleRowExpansion={() => { }}
            renderExpandedRow={() => null}
            renderCustomActions={(item) => (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedDossier(item);
                }}
                aria-label="Gérer opérations"
                title="Gérer opérations"
                className="d-flex align-items-center"
                style={{
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  color: "#2c767c",
                  gap: "8px",
                  padding: 0
                }}
              >
                <FontAwesomeIcon icon={faEye} style={{ fontSize: "14px", color: "#2c767c" }} />
                <span style={{ fontSize: "13px", fontWeight: 600 }}>Gérer</span>
              </button>
            )}
            canEdit={false}
            canDelete={false}
            canBulkDelete={true}
            handleDeleteSelected={handleDeleteSelected}
          />
        </div>

        {/* Resizer Handle */}
        {isAnyFormOpen && (
          <div
            onMouseDown={startResizing}
            style={{
              width: "8px",
              cursor: "col-resize",
              backgroundColor: isResizing ? "#2c767c" : "transparent",
              transition: "background-color 0.2s",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <div style={{ width: "2px", height: "30px", backgroundColor: "#e2e8f0", borderRadius: "1px" }} />
          </div>
        )}

        {/* Right Pane: Details or Operation Form */}
        {isAnyFormOpen && (
          <div
            className="split-view-drawer"
            style={{
              flexGrow: 0,
              flexShrink: 0,
              flexBasis: `${drawerWidth}%`,
              height: "100%",
              overflow: "auto",
              position: "relative",
              backgroundColor: "#ffffff",
              boxShadow: "-0.25rem 0 0.9375rem rgba(0,0,0,0.05)",
              transition: isResizing ? "none" : "flex-basis 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
              minWidth: "0",
              maxWidth: "90vw",
              boxSizing: "border-box",
              willChange: "flex-basis",
              contain: "layout style"
            }}
          >
            {isDetailsOpen && (
              <DossierCNSSDetails
                dossier={selectedDossier}
                onClose={() => setSelectedDossier(null)}
                  onDocumentsUpdated={() => fetchDossiers(true)}
              />
            )}
            {showAddOperation && addOperationEmployeId && (
              <AddCnssOperation
                employeId={addOperationEmployeId}
                mode="add"
                operation={null}
                typeOptions={[]}
                onClose={handleCloseAddOperation}
                onSaved={async () => {
                  handleCloseAddOperation();
                  await fetchDossiers(true);
                }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default DossierCNSSTable;
