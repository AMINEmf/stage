import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button, Dropdown, Form } from "react-bootstrap";
import { faClose, faEye, faFilter, faSliders } from "@fortawesome/free-solid-svg-icons";
import { BarChart2 } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { FaPlusCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart } from "@mui/x-charts/BarChart";
import ExpandRTable from "../Employe/ExpandRTable";
import AddDeclarationCNSS from "./AddDeclarationCNSS";
import DeclarationDetails from "./DeclarationDetails";
import "../Style.css";

const monthLabelFromNumber = (monthValue) => {
  const month = Number(monthValue);
  const labels = [
    "Janvier",
    "Fevrier",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Aout",
    "Septembre",
    "Octobre",
    "Novembre",
    "Decembre",
  ];

  if (month < 1 || month > 12) return "-";
  return labels[month - 1];
};

const formatCurrency = (value) => {
  const parsedValue = Number(value ?? 0);
  if (!Number.isFinite(parsedValue)) return "-";
  return `${parsedValue.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} MAD`;
};

const normalizeValue = (value) => (value == null ? "" : String(value).toLowerCase().trim());

const DeclarationsTable = forwardRef((props, ref) => {
  const { globalSearch, filtersVisible, handleFiltersToggle } = props;

  const [declarations, setDeclarations] = useState([]);
  const [drawerMode, setDrawerMode] = useState(null);
  const [selectedDeclaration, setSelectedDeclaration] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);

  // ── Expand rows ──────────────────────────────────────────────────────────────
  const [expandedRows, setExpandedRows] = useState({});
  const [expandedEmployees, setExpandedEmployees] = useState({}); // { [declarationId]: { loading, data } }
  const navigate = useNavigate();

  const toggleRowExpansion = useCallback(async (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
    // Fetch only once
    if (!expandedEmployees[id]) {
      setExpandedEmployees((prev) => ({ ...prev, [id]: { loading: true, data: [] } }));
      try {
        const res = await axios.get(`http://127.0.0.1:8000/api/cnss/declarations/${id}`);
        const details = Array.isArray(res.data?.details) ? res.data.details : [];
        setExpandedEmployees((prev) => ({ ...prev, [id]: { loading: false, data: details } }));
      } catch {
        setExpandedEmployees((prev) => ({ ...prev, [id]: { loading: false, data: [] } }));
      }
    }
  }, [expandedEmployees]);

  const renderExpandedRow = useCallback((item) => {
    const entry = expandedEmployees[item.id];
    const loading = entry?.loading;
    const rows = entry?.data || [];

    return (
      <div style={{ padding: "12px 0" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          marginBottom: "12px", fontWeight: 700, fontSize: "0.8rem",
          color: "#2c767c", textTransform: "uppercase", letterSpacing: "0.06em",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2c767c" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Employés déclarés — {monthLabelFromNumber(item.mois)} {item.annee}
        </div>
        {loading ? (
          <div style={{ textAlign: "center", padding: "20px", color: "#6b7280", fontSize: "0.85rem" }}>
            Chargement...
          </div>
        ) : (
          <table style={{
            width: "100%", borderCollapse: "collapse",
            fontSize: "0.85rem", backgroundColor: "#fff",
            border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden",
          }}>
            <thead>
              <tr style={{ backgroundColor: "#f0fdfa" }}>
                {["Matricule", "Employé", "N° CNSS", "Jours trav.", "Salaire brut imp.", ""].map((h) => (
                  <th key={h} style={{
                    padding: "10px 14px", textAlign: h === "Salaire brut imp." ? "right" : "left",
                    fontWeight: 700, color: "#374151",
                    fontSize: "0.78rem", textTransform: "uppercase",
                    letterSpacing: "0.05em", borderBottom: "1px solid #e5e7eb",
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#6b7280" }}>
                    Aucun employé déclaré pour cette période.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={row.id ?? i} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                    <td style={{ padding: "9px 14px", borderBottom: "1px solid #f3f4f6" }}>
                      <span style={{
                        background: "#e0f2f1", color: "#2c767c",
                        padding: "3px 9px", borderRadius: "4px", fontWeight: 600, fontSize: "0.82rem",
                      }}>{row.matricule || "-"}</span>
                    </td>
                    <td style={{ padding: "9px 14px", borderBottom: "1px solid #f3f4f6", fontWeight: 600, color: "#111827" }}>
                      {`${row.nom || ""} ${row.prenom || ""}`.trim() || "-"}
                    </td>
                    <td style={{ padding: "9px 14px", borderBottom: "1px solid #f3f4f6", color: "#6b7280" }}>
                      {row.numero_cnss || "-"}
                    </td>
                    <td style={{ padding: "9px 14px", borderBottom: "1px solid #f3f4f6", color: "#374151" }}>
                      {row.jours_travailles ?? "-"}
                    </td>
                    <td style={{ padding: "9px 14px", borderBottom: "1px solid #f3f4f6", textAlign: "right", color: "#2c767c", fontWeight: 600 }}>
                      {formatCurrency(row.salaire)}
                    </td>
                    <td style={{ padding: "9px 14px", borderBottom: "1px solid #f3f4f6", textAlign: "center" }}>
                      <button
                        title={`Voir déclarations individuelles de ${row.nom} ${row.prenom}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/cnss/declarations-individuelles", {
                            state: { employeeId: row.employe_id, employeeNom: row.nom, employeePrenom: row.prenom },
                          });
                        }}
                        style={{
                          border: "none", background: "transparent", cursor: "pointer",
                          color: "#2c767c", padding: "4px", borderRadius: "4px",
                          display: "inline-flex", alignItems: "center",
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    );
  }, [expandedEmployees, navigate]);
  const [filterOptions, setFilterOptions] = useState({
    filters: [
      {
        key: "mois",
        label: "Mois",
        type: "select",
        value: "",
        options: [
          { label: "Janvier", value: "1" },
          { label: "Fevrier", value: "2" },
          { label: "Mars", value: "3" },
          { label: "Avril", value: "4" },
          { label: "Mai", value: "5" },
          { label: "Juin", value: "6" },
          { label: "Juillet", value: "7" },
          { label: "Aout", value: "8" },
          { label: "Septembre", value: "9" },
          { label: "Octobre", value: "10" },
          { label: "Novembre", value: "11" },
          { label: "Decembre", value: "12" },
        ],
        placeholder: "Tous",
      },
      {
        key: "annee",
        label: "Annee",
        type: "select",
        value: "",
        options: [
          { label: "2024", value: "2024" },
          { label: "2025", value: "2025" },
          { label: "2026", value: "2026" },
          { label: "2027", value: "2027" },
          { label: "2028", value: "2028" },
        ],
        placeholder: "Toutes",
      },
      {
        key: "statut",
        label: "Statut",
        type: "select",
        value: "",
        options: [
          { label: "En attente", value: "EN_ATTENTE" },
          { label: "Declare", value: "DECLARE" },
          { label: "Paye", value: "PAYE" },
        ],
        placeholder: "Tous",
      },
    ],
  });

  const allColumns = useMemo(
    () => [
      {
        key: "mois",
        label: "Mois",
        render: (item) => <span>{monthLabelFromNumber(item.mois)}</span>,
      },
      { key: "annee", label: "Annee" },
      {
        key: "nombre_employes",
        label: "Nombre d'employes declares",
        render: (item) => <span>{item.nombre_employes ?? 0}</span>,
      },
      {
        key: "masse_salariale",
        label: "Masse salariale",
        render: (item) => <span>{formatCurrency(item.masse_salariale)}</span>,
      },
      {
        key: "montant_total",
        label: "Montant CNSS",
        render: (item) => <span>{formatCurrency(item.montant_total)}</span>,
      },
      {
        key: "statut",
        label: "Statut",
        render: (item) => {
          const statut = item.statut || "EN_ATTENTE";
          const badgeClass =
            statut === "PAYE" ? "bg-success" : statut === "DECLARE" ? "bg-primary" : "bg-secondary";
          return <span className={`badge ${badgeClass}`}>{statut}</span>;
        },
      },
    ],
    []
  );
  const isFormDrawerOpen = drawerMode === "add" || drawerMode === "edit";
  const isDetailsDrawerOpen = drawerMode === "view";
  const isDrawerOpen = isFormDrawerOpen || isDetailsDrawerOpen || showChartModal;

  const visibleColumns = useMemo(() => {
    return allColumns.filter((column) => columnVisibility[column.key]);
  }, [allColumns, columnVisibility]);

  const fetchDeclarations = useCallback(async () => {
    setIsTableLoading(true);
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/cnss/declarations");
      const declarationsData = Array.isArray(response.data) ? response.data : [];
      setDeclarations(declarationsData);
    } catch (error) {
      console.error("Erreur lors de la recuperation des declarations CNSS:", error);
      Swal.fire("Erreur", "Impossible de charger les declarations CNSS.", "error");
      setDeclarations([]);
    } finally {
      setIsTableLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeclarations();
  }, [fetchDeclarations]);

  useEffect(() => {
    const savedColumnVisibility = localStorage.getItem("cnssDeclarationsColumnVisibility");

    if (savedColumnVisibility) {
      setColumnVisibility(JSON.parse(savedColumnVisibility));
      return;
    }

    const defaultVisibility = {};
    allColumns.forEach((column) => {
      defaultVisibility[column.key] = true;
    });
    setColumnVisibility(defaultVisibility);
    localStorage.setItem("cnssDeclarationsColumnVisibility", JSON.stringify(defaultVisibility));
  }, [allColumns]);

  const filteredDeclarationsBySearch = useMemo(() => {
    const search = normalizeValue(globalSearch);

    return declarations.filter((item) => {
      if (!search) return true;
      return (
        normalizeValue(monthLabelFromNumber(item.mois)).includes(search) ||
        normalizeValue(item.annee).includes(search) ||
        normalizeValue(item.statut).includes(search) ||
        normalizeValue(item.nombre_employes).includes(search)
      );
    });
  }, [declarations, globalSearch]);

  const filteredDeclarations = useMemo(() => {
    const moisFilter = filterOptions.filters.find((filter) => filter.key === "mois");
    const anneeFilter = filterOptions.filters.find((filter) => filter.key === "annee");
    const statutFilter = filterOptions.filters.find((filter) => filter.key === "statut");

    return filteredDeclarationsBySearch.filter((item) => {
      // Filtre par mois
      if (moisFilter?.value && String(item.mois) !== String(moisFilter.value)) {
        return false;
      }
      
      // Filtre par année
      if (anneeFilter?.value && String(item.annee) !== String(anneeFilter.value)) {
        return false;
      }
      
      // Filtre par statut
      if (statutFilter?.value && normalizeValue(item.statut) !== normalizeValue(statutFilter.value)) {
        return false;
      }
      
      return true;
    });
  }, [filteredDeclarationsBySearch, filterOptions]);

  const handleColumnsChange = useCallback((column) => {
    setColumnVisibility((prev) => {
      const updated = { ...prev, [column]: !prev[column] };
      localStorage.setItem("cnssDeclarationsColumnVisibility", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleAddNewDeclaration = useCallback(() => {
    if (drawerMode) return;
    setShowChartModal(false);
    setSelectedDeclaration(null);
    setDrawerMode("add");
  }, [drawerMode]);

  const handleCloseDrawer = useCallback(() => {
    setDrawerMode(null);
    setSelectedDeclaration(null);
  }, []);

  const handleDeclarationSaved = useCallback(async () => {
    await fetchDeclarations();
  }, [fetchDeclarations]);

  const handleOpenDetails = useCallback((declaration) => {
    setShowChartModal(false);
    setSelectedDeclaration(declaration);
    setDrawerMode("view");
  }, []);

  const handleEditDeclaration = useCallback((declaration) => {
    setShowChartModal(false);
    setSelectedDeclaration(declaration);
    setDrawerMode("edit");
  }, []);

  const handleDeleteDeclaration = useCallback(
    async (declarationId) => {
      const result = await Swal.fire({
        title: "Etes-vous sur ?",
        text: "Cette declaration sera supprimee.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Oui, supprimer",
        cancelButtonText: "Annuler",
      });

      if (!result.isConfirmed) return;

      try {
        await axios.delete(`http://127.0.0.1:8000/api/cnss/declarations/${declarationId}`);
        await fetchDeclarations();
        Swal.fire("Supprime", "La declaration a ete supprimee.", "success");
      } catch (error) {
        console.error("Erreur lors de la suppression de la declaration:", error);
        Swal.fire("Erreur", "Impossible de supprimer la declaration.", "error");
      }
    },
    [fetchDeclarations]
  );

  const handleChangePage = useCallback((newPage) => {
    setCurrentPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    setItemsPerPage(parseInt(event.target.value, 10));
    setCurrentPage(0);
  }, []);

  const handleSelectAllChange = useCallback(
    (event) => {
      if (event.target.checked) {
        setSelectedItems(filteredDeclarations.map((item) => item.id));
      } else {
        setSelectedItems([]);
      }
    },
    [filteredDeclarations]
  );

  const handleCheckboxChange = useCallback((id) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((itemId) => itemId !== id);
      }
      return [...prev, id];
    });
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedItems.length === 0) return;

    const result = await Swal.fire({
      title: "Etes-vous sur ?",
      text: "Les declarations selectionnees seront supprimees.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Oui, supprimer",
      cancelButtonText: "Annuler",
    });

    if (!result.isConfirmed) return;

    try {
      await Promise.all(
        selectedItems.map((declarationId) =>
          axios.delete(`http://127.0.0.1:8000/api/cnss/declarations/${declarationId}`)
        )
      );
      setSelectedItems([]);
      await fetchDeclarations();
      Swal.fire("Supprime", "Les declarations ont ete supprimees.", "success");
    } catch (error) {
      console.error("Erreur lors de la suppression des declarations:", error);
      Swal.fire("Erreur", "Impossible de supprimer les declarations selectionnees.", "error");
    }
  }, [fetchDeclarations, selectedItems]);

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
    const tableRows = filteredDeclarations.map((item) =>
      allColumns
        .filter((column) => columnVisibility[column.key])
        .map((column) => {
          if (column.key === "mois") return monthLabelFromNumber(item.mois);
          if (column.key === "montant_total" || column.key === "masse_salariale") {
            return formatCurrency(item[column.key]);
          }
          return item[column.key];
        })
    );

    doc.setFontSize(18);
    doc.text("Declarations CNSS", 14, 22);
    doc.setFontSize(11);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.autoTable({
      head: [tableColumns],
      body: tableRows,
      startY: 35,
    });
    doc.save("cnss_declarations.pdf");
  }, [allColumns, columnVisibility, filteredDeclarations]);

  const exportToExcel = useCallback(() => {
    const worksheetData = filteredDeclarations.map((item) => {
      const row = {};
      allColumns.forEach((column) => {
        if (!columnVisibility[column.key]) return;
        if (column.key === "mois") {
          row[column.label] = monthLabelFromNumber(item.mois);
        } else if (column.key === "montant_total" || column.key === "masse_salariale") {
          row[column.label] = formatCurrency(item[column.key]);
        } else {
          row[column.label] = item[column.key];
        }
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Declarations CNSS");
    XLSX.writeFile(wb, "cnss_declarations.xlsx");
  }, [allColumns, columnVisibility, filteredDeclarations]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const tableColumns = allColumns.filter((column) => columnVisibility[column.key]).map((column) => column.label);
    const tableRows = filteredDeclarations.map((item) =>
      allColumns
        .filter((column) => columnVisibility[column.key])
        .map((column) => {
          if (column.key === "mois") return monthLabelFromNumber(item.mois);
          if (column.key === "montant_total" || column.key === "masse_salariale") {
            return formatCurrency(item[column.key]);
          }
          return item[column.key];
        })
    );

    const tableHtml = `
      <html>
        <head>
          <title>Declarations CNSS</title>
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>Declarations CNSS</h1>
          <table>
            <thead>
              <tr>${tableColumns.map((column) => `<th>${column}</th>`).join("")}</tr>
            </thead>
            <tbody>
              ${tableRows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(tableHtml);
    printWindow.document.close();
    printWindow.print();
  }, [allColumns, columnVisibility, filteredDeclarations]);

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

  // Données pour le graphe
  const chartData = useMemo(() => {
    const sorted = [...declarations].sort((a, b) =>
      a.annee !== b.annee ? a.annee - b.annee : a.mois - b.mois
    );
    return {
      labels: sorted.map((d) => `${monthLabelFromNumber(d.mois)} ${d.annee}`),
      masseSalariale: sorted.map((d) => Number(d.masse_salariale || 0)),
      montantCNSS: sorted.map((d) => Number(d.montant_total || 0)),
    };
  }, [declarations]);

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
            id={`declaration-column-${column.key}`}
            label={column.label}
            checked={columnVisibility[column.key]}
            onChange={() => handleColumnsChange(column.key)}
          />
        ))}
      </Form>
    </div>
  ));

  return (
    <>
      <style jsx>{`
        .with-split-view .addemp-overlay, 
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
        
        /* Styles de section header */
        .section-header {
            border-bottom: none;
            padding-bottom: 15px;
            margin: 0.5% 1% 1%;
        }

        .section-title {
            color: #2c3e50;
            font-weight: 600;
            margin-bottom: 5px;
            display: flex;
            align-items: center;
            font-size: 19px;
        }

        .section-title i {
            color: rgba(8, 179, 173, 0.02);
            background: #3a8a90;
            padding: 6px;
            border-radius: 60%;
            margin-right: 10px;
        }

        .section-description {
            color: #6c757d;
            font-size: 16px;
            margin-bottom: 0;
        }

        .btn-primary {
            background-color: #3a8a90;
            border-color: #3a8a90;
            color: white;
            border-radius: 0.375rem;
            font-weight: 500;
            padding: 0.5rem 1rem;
            transition: background-color 0.15s ease-in-out;
        }

        .content-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #4b5563;
            margin-bottom: 5px;
        }

        @keyframes slideInChart {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        .chart-panel {
          background: #fff;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .chart-drawer-header {
          padding: 16px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-shrink: 0;
        }
        .chart-drawer-header h3 {
          margin: 0;
          font-size: 18px;
          color: #2c767c;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .chart-drawer-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        .chart-drawer-body::-webkit-scrollbar { width: 6px; }
        .chart-drawer-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>

      <div className="with-split-view" style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Colonne de Gauche : Tableau */}
        <div style={{
          flex: isDrawerOpen ? '0 0 55%' : '1 1 100%',
          overflowY: 'auto',
          overflowX: 'auto',
          borderRight: isDrawerOpen ? '2px solid #eef2f5' : 'none',
          transition: 'flex 0.3s ease-in-out',
          padding: '0 20px',
          backgroundColor: 'white'
        }}>
        <div className="mt-4">
          <div className="section-header mb-3">
            <div className="d-flex align-items-center justify-content-between" style={{ gap: 24 }}>
              <div>
                <span className="section-title mb-1" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2c767c', textTransform: 'none' }}>
                  <i className="fas fa-id-card me-2"></i>
                  Declarations CNSS
                </span>
                <p className="section-description text-muted mb-0">
                  {filteredDeclarations.length} declaration{filteredDeclarations.length > 1 ? "s" : ""} affichee
                  {filteredDeclarations.length > 1 ? "s" : ""}
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                {!isDrawerOpen && (
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
                  </>
                )}

                <button
                  onClick={() => { setDrawerMode(null); setSelectedDeclaration(null); setShowChartModal(true); }}
                  title="Voir graphe"
                  style={{
                    ...iconButtonStyle,
                    backgroundColor: "#2c767c",
                    border: "1px solid #2c767c",
                    color: "#fff",
                    padding: "6px 12px",
                    borderRadius: "10px",
                  }}
                >
                  <BarChart2 size={18} color="#ffffff" strokeWidth={2} />
                </button>

                <Button
                  onClick={handleAddNewDeclaration}
                  className="btn btn-outline-primary d-flex align-items-center"
                  size="sm"
                  style={{ whiteSpace: "nowrap" }}
                >
                  <FaPlusCircle className="me-2" />
                  Nouvelle declaration
                </Button>

                {!isDrawerOpen && (
                  <Dropdown show={showDropdown} onToggle={(isOpen) => setShowDropdown(isOpen)}>
                    <Dropdown.Toggle
                      as="button"
                      id="dropdown-visibility-declarations"
                      title="Visibilite Colonnes"
                      style={iconButtonStyle}
                    >
                      <FontAwesomeIcon icon={faSliders} style={{ width: 18, height: 18, color: "#4b5563" }} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu as={CustomMenu} />
                  </Dropdown>
                )}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {filtersVisible && !isDrawerOpen && (
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
                      value={filter.value}
                      onChange={(event) => handleFilterChange(filter.key, event.target.value)}
                      className="filter-input"
                      style={{
                        minWidth: 110,
                        maxWidth: 130,
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
          data={filteredDeclarations}
          loading={isTableLoading}
          loadingText="Chargement des declarations CNSS..."
          searchTerm={normalizeValue(globalSearch)}
          highlightText={highlightText}
          selectAll={selectedItems.length === filteredDeclarations.length && filteredDeclarations.length > 0}
          selectedItems={selectedItems}
          handleSelectAllChange={handleSelectAllChange}
          handleCheckboxChange={handleCheckboxChange}
          handleEdit={handleEditDeclaration}
          handleDelete={handleDeleteDeclaration}
          handleDeleteSelected={handleDeleteSelected}
          rowsPerPage={itemsPerPage}
          page={currentPage}
          handleChangePage={handleChangePage}
          handleChangeRowsPerPage={handleChangeRowsPerPage}
          expandedRows={expandedRows}
          toggleRowExpansion={toggleRowExpansion}
          renderExpandedRow={renderExpandedRow}
          renderCustomActions={(item) => (
            <button
              onClick={(event) => {
                event.stopPropagation();
                handleOpenDetails(item);
              }}
              aria-label="Voir details"
              title="Voir details"
              style={{
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
              }}
            >
              <FontAwesomeIcon icon={faEye} style={{ color: "#007bff", fontSize: "14px" }} />
            </button>
          )}
        />
      </div>

      {/* Colonne de Droite : Formulaire */}
      {isDrawerOpen && (
        <div style={{
          flex: '0 0 45%',
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          boxShadow: '-4px 0 15px rgba(0,0,0,0.05)',
          position: 'relative',
          height: '100%'
        }}>
          {isFormDrawerOpen && (
            <AddDeclarationCNSS
              toggleDeclarationForm={handleCloseDrawer}
              onDeclarationSaved={handleDeclarationSaved}
              selectedDeclaration={selectedDeclaration}
            />
          )}

          {isDetailsDrawerOpen && selectedDeclaration && (
            <DeclarationDetails declaration={selectedDeclaration} onClose={handleCloseDrawer} />
          )}
          {showChartModal && (
            <div className="chart-panel" style={{ animation: "slideInChart 0.3s cubic-bezier(0.4,0,0.2,1) both" }}>
              <div className="chart-drawer-header">
                <h3>
                  <BarChart2 size={18} color="#2c767c" strokeWidth={2} />
                  Graphe des D&eacute;clarations CNSS
                </h3>
                <button
                  onClick={() => setShowChartModal(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    lineHeight: 1,
                  }}
                  aria-label="Fermer"
                >
                  &times;
                </button>
              </div>
              <div className="chart-drawer-body">
                {declarations.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#6b7280", padding: "60px 0" }}>
                    Aucune donn&eacute;e disponible pour afficher le graphe.
                  </p>
                ) : (
                  <>
                    <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "20px" }}>
                      {declarations.length}&nbsp;d&eacute;claration(s) &mdash; Masse salariale &amp; Montant CNSS par mois
                    </p>
                    <BarChart
                      xAxis={[{
                        scaleType: "band",
                        data: chartData.labels,
                        tickLabelStyle: { fontSize: 10 },
                      }]}
                      series={[
                        {
                          data: chartData.masseSalariale,
                          label: "Masse salariale (MAD)",
                          color: "#2c767c",
                          valueFormatter: (v) => `${v.toLocaleString("fr-FR")} MAD`,
                        },
                        {
                          data: chartData.montantCNSS,
                          label: "Montant CNSS (MAD)",
                          color: "#f59e0b",
                          valueFormatter: (v) => `${v.toLocaleString("fr-FR")} MAD`,
                        },
                      ]}
                      height={360}
                      margin={{ top: 20, right: 20, bottom: 70, left: 80 }}
                      sx={{
                        ".MuiChartsAxis-tickLabel": { fontSize: "0.75rem" },
                        ".MuiChartsLegend-root": { fontSize: "0.78rem" },
                      }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "24px" }}>
                      {[
                        { label: "Masse salariale totale", value: declarations.reduce((s, d) => s + Number(d.masse_salariale || 0), 0), color: "#2c767c" },
                        { label: "Montant CNSS total",     value: declarations.reduce((s, d) => s + Number(d.montant_total   || 0), 0), color: "#f59e0b" },
                        { label: "D&eacute;clarations", value: null, count: declarations.length, color: "#6366f1" },
                        { label: "Mois couverts", value: null, count: new Set(declarations.map((d) => `${d.mois}-${d.annee}`)).size, color: "#10b981" },
                      ].map((card) => (
                        <div key={card.label} style={{
                          background: "#f8fafc",
                          border: `1px solid ${card.color}33`,
                          borderRadius: "10px",
                          padding: "14px 18px",
                        }}>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                            {card.label}
                          </p>
                          <p style={{ margin: "6px 0 0", fontSize: "1.1rem", fontWeight: 700, color: card.color }}>
                            {card.value !== null
                              ? `${card.value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MAD`
                              : card.count}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      </div>
    </>
  );
});

export default DeclarationsTable;