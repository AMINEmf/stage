import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
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
import ExpandRTable from "../Employe/ExpandRTable";
import DossierCNSSDetails from "./DossierCNSSDetails";
import AddCnssOperation from "./AddCnssOperation";
import "../Style.css";

const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : "http://127.0.0.1:8000";

const normalizeValue = (value) => (value == null ? "" : String(value).toLowerCase().trim());

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
  const [selectedEmployeId, setSelectedEmployeId] = useState(null);
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

  const isDetailsOpen = Boolean(selectedEmployeId);
  const isAnyFormOpen = isDetailsOpen || showAddOperation;
  const hasSelectedDepartement = Boolean(departementId);

  const fetchDossiers = useCallback(async () => {
    if (!departementId) {
      setDossiers([]);
      setIsTableLoading(false);
      return;
    }

    setIsTableLoading(true);
    try {
      const departementIds = includeSubDepartments && getSubDepartmentIds
        ? getSubDepartmentIds(departements || [], departementId)
        : [departementId];

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
    } catch (error) {
      console.error("Erreur lors du chargement des dossiers CNSS:", error);
      setDossiers([]);
    } finally {
      setIsTableLoading(false);
    }
  }, [departementId, includeSubDepartments, getSubDepartmentIds, departements]);

  useEffect(() => {
    fetchDossiers();
  }, [fetchDossiers]);

  useEffect(() => {
    setSelectedEmployeId(null);
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
        key: "employe_label",
        label: "Nom & Prenom",
        render: (item) => <span>{item.employe_label}</span>,
      },
      {
        key: "numero_adherent",
        label: "Numéro adhérent",
        render: (item) => <span>{item.numero_adherent || "-"}</span>,
      },
      {
        key: "operations_count",
        label: "Nombre d'opérations",
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

  const canOpenAddOperation = hasSelectedDepartement;

  const handleFilterChange = useCallback((key, value) => {
    setFilterOptions((prev) => ({
      ...prev,
      filters: prev.filters.map((filter) => (filter.key === key ? { ...filter, value } : filter)),
    }));
  }, []);

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
    doc.text("Dossier CNSS", 14, 22);
    doc.setFontSize(11);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: 35,
    });
    doc.save("cnss_dossiers.pdf");
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
    XLSX.utils.book_append_sheet(wb, ws, "Dossier CNSS");
    XLSX.writeFile(wb, "cnss_dossiers.xlsx");
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
          <title>Dossier CNSS</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Dossier CNSS</h1>
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
    border: "1px solid #ccc",
    borderRadius: "5px",
    padding: "13px 16px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const CustomMenu = React.forwardRef(({ className, "aria-labelledby": labeledBy }, customRef) => (
    <div
      ref={customRef}
      className={className}
      aria-labelledby={labeledBy}
      style={{
        padding: "10px",
        backgroundColor: "white",
        border: "1px solid #ccc",
        borderRadius: "5px",
        maxHeight: "400px",
        overflowY: "auto",
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
        height: "calc(100vh - 160px)",
      }}
      className="container_employee"
    >
      <div className={`with-split-view ${isAnyFormOpen ? "split-active" : ""}`} style={{ width: "100%", height: "100%", display: "flex", overflow: "hidden" }}>
        {/* CSS Override for Split View */}
        <style>
          {`
        .with-split-view .add-cnss-container, 
        .with-split-view .add-accident-container,
        .with-split-view .side-panel-container {
            position: relative !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            box-shadow: none !important;
            animation: none !important;
            border-radius: 0 !important;
        }
      `}
        </style>

        {/* Left Pane: Table & Filters */}
        <div
          style={{
            flex: isAnyFormOpen ? "0 0 55%" : "1 1 100%",
            overflowY: "auto",
            overflowX: "auto",
            borderRight: isAnyFormOpen ? "2px solid #eef2f5" : "none",
            transition: "all 0.3s ease",
            paddingRight: "10px",
          }}
        >
          <div className="mt-4">
            <div className="section-header mb-3">
              <div className="d-flex align-items-center justify-content-between" style={{ gap: 24 }}>
                <div>
                  <span className="section-title mb-1">
                    <i className="fas fa-id-card me-2"></i>
                    Dossier CNSS
                  </span>
                  {!isDetailsOpen && (
                    <p className="section-description text-muted mb-0">
                      {filteredDossiers.length} dossier{filteredDossiers.length > 1 ? "s" : ""} affiche
                      {filteredDossiers.length > 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                  {!isDetailsOpen && (
                    <>
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
                      <Button
                        onClick={() => {
                          if (!canOpenAddOperation) return;
                          handleOpenAddOperation();
                        }}
                        className={`btn btn-outline-primary d-flex align-items-center ${!canOpenAddOperation ? "disabled-btn" : ""}`}
                        size="sm"
                        style={{
                          marginRight: '30px !important',
                          width: '160px',
                        }}
                      >
                        <FaPlusCircle className="me-2" />
                        Ajouter une opération
                      </Button>

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
                          minWidth: 110,
                          maxWidth: 170,
                          height: 30,
                          fontSize: "0.9rem",
                          padding: "2px 6px",
                          borderRadius: 6,
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
            loadingText="Chargement des dossiers CNSS..."
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
                  setSelectedEmployeId(item.id);
                }}
                aria-label="Voir dossier"
                title="Voir dossier"
                style={{
                  border: "none",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                }}
              >
                <FontAwesomeIcon icon={faEye} style={{ color: "#007bff", fontSize: "14px" }} />
              </button>
            )}
            canEdit={false}
            canDelete={false}
            canBulkDelete={false}
          />
        </div>

        {/* Right Pane: Details or Operation Form */}
        {isAnyFormOpen && (
          <div
            style={{
              flex: "0 0 45%",
              overflowY: "auto",
              backgroundColor: "#fdfdfd",
              boxShadow: "-4px 0 15px rgba(0,0,0,0.05)",
            }}
          >
            {isDetailsOpen && (
              <DossierCNSSDetails
                employeId={selectedEmployeId}
                onClose={() => setSelectedEmployeId(null)}
                onDocumentsUpdated={fetchDossiers}
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
                  await fetchDossiers();
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
