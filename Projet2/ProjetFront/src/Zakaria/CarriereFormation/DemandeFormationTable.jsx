import React, { useMemo, useState } from "react";
import { Button, Form } from "react-bootstrap";
import Dropdown from "react-bootstrap/Dropdown";
import { FaPlusCircle } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faFilter, faClose, faSliders } from "@fortawesome/free-solid-svg-icons";
import ExpandRTable from "../Employe/ExpandRTable";
import { STATUTS_FORMATION, STATUTS_DEMANDE_FORMATION_LIST } from "../../constants/status";

const STATUTS = STATUTS_DEMANDE_FORMATION_LIST;
const URGENCES = ["Faible", "Moyenne", "Haute"];

const statusBadgeStyle = {
  [STATUTS_FORMATION.EN_ETUDE]: { background: "#f3f4f6", color: "#6b7280" },
  [STATUTS_FORMATION.VALIDEE]: { background: "#dcfce7", color: "#15803d" },
  [STATUTS_FORMATION.REFUSEE]: { background: "#fee2e2", color: "#b91c1c" },
  [STATUTS_FORMATION.PLANIFIEE]: { background: "#dbeafe", color: "#1d4ed8" },
  [STATUTS_FORMATION.REALISEE]: { background: "#ede9fe", color: "#6d28d9" },
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR");
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (Number.isNaN(number)) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "MAD", maximumFractionDigits: 2 }).format(number);
};

const StatusBadge = ({ status }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "4px 10px",
      borderRadius: "999px",
      fontSize: "0.75rem",
      fontWeight: 600,
      whiteSpace: "nowrap",
      ...(statusBadgeStyle[status] || statusBadgeStyle[STATUTS_FORMATION.EN_ETUDE]),
    }}
  >
    {status || "—"}
  </span>
);

const DemandeFormationTable = ({
  rows,
  loading,
  filters,
  departements,
  onFiltersChange,
  onResetFilters,
  onAdd,
  onView,
  onEdit,
  onDelete,
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState({
    employe_nom_complet: true,
    formation_souhaitee: true,
    objectif: true,
    lien_poste: true,
    urgence: true,
    cout_estime: true,
    statut: true,
    created_at: true,
  });

  const columns = useMemo(
    () => [
      { key: "employe_nom_complet", label: "Employé", render: (row) => <span title={row.employe_nom_complet || ""}>{row.employe_nom_complet || "—"}</span> },
      { key: "formation_souhaitee", label: "Formation souhaitée" },
      { key: "objectif", label: "Objectif", render: (row) => <span title={row.objectif || ""}>{row.objectif || "—"}</span> },
      { key: "lien_poste", label: "Lien avec poste", render: (row) => <span title={row.lien_poste || ""}>{row.lien_poste || "—"}</span> },
      { key: "urgence", label: "Urgence" },
      { key: "cout_estime", label: "Coût estimé", render: (row) => formatCurrency(row.cout_estime) },
      { key: "statut", label: "Statut", render: (row) => <StatusBadge status={row.statut} /> },
      { key: "created_at", label: "Date création", render: (row) => formatDate(row.created_at) },
    ],
    []
  );

  const visibleColumns = useMemo(() => columns.filter((col) => columnVisibility[col.key] !== false), [columns, columnVisibility]);

  const iconButtonStyle = {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    backgroundColor: "#ffffff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  };

  const toggleColumnVisibility = (key) => setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  const handleFilterField = (key, value) => onFiltersChange({ ...filters, [key]: value });

  const handleDeleteById = (id) => {
    const row = rows.find((item) => item.id === id);
    if (row) onDelete(row);
  };

  const CustomMenu = React.forwardRef(({ className, "aria-labelledby": labeledBy }, menuRef) => (
    <div
      ref={menuRef}
      className={className}
      aria-labelledby={labeledBy}
      style={{ padding: "0.75rem", borderRadius: "0.5rem", border: "0.0625rem solid #ccc", maxHeight: "max(300px, 40vh)", maxWidth: "90vw", overflowY: "auto", boxSizing: "border-box" }}
    >
      <Form onClick={(event) => event.stopPropagation()}>
        {columns.map((column) => (
          <Form.Check
            key={column.key}
            type="checkbox"
            id={`formation-column-${column.key}`}
            label={column.label}
            checked={columnVisibility[column.key] !== false}
            onChange={() => toggleColumnVisibility(column.key)}
          />
        ))}
      </Form>
    </div>
  ));

  CustomMenu.displayName = "CustomMenu";

  const isEmpty = !loading && rows.length === 0;

  return (
    <div style={{ position: "relative", top: "0", height: "calc(100vh - 120px)", flex: 1, minWidth: 0, overflowY: "auto", overflowX: "visible" }} className="container_employee mobilite-layout-fix">
      <div className="mt-4">
        <div className="section-header mb-3">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) auto",
              alignItems: "center",
              columnGap: "16px",
              width: "100%",
            }}
          >
            <div style={{ flex: "1 1 300px", minWidth: 0 }}>
              <span className="section-title mb-1" style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#2c767c" }}>
                <i className="fas fa-graduation-cap me-2"></i>
                Demandes de formation
              </span>
              <p className="section-description text-muted mb-0">
                {rows.length} demande{rows.length > 1 ? "s" : ""} affichée{rows.length > 1 ? "s" : ""}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", justifySelf: "end" }}>
              <FontAwesomeIcon
                onClick={() => setFiltersVisible((prev) => !prev)}
                icon={filtersVisible ? faClose : faFilter}
                color={filtersVisible ? "green" : ""}
                style={{ cursor: "pointer", fontSize: "1.9rem", color: "#2c767c", marginTop: "1.3%", marginRight: "8px" }}
              />

              <Button
                onClick={onAdd}
                className="d-flex align-items-center justify-content-center"
                size="sm"
                style={{
                  minWidth: "220px",
                  height: "38px",
                  backgroundColor: "#3a8a90",
                  border: "none",
                  borderRadius: "8px",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  boxShadow: "0 3px 8px rgba(58, 138, 144, 0.28)",
                  whiteSpace: "nowrap",
                }}
              >
                <FaPlusCircle className="me-2" />
                Ajouter une demande
              </Button>

              <Dropdown show={showDropdown} onToggle={(isOpen) => setShowDropdown(isOpen)}>
                <Dropdown.Toggle as="button" id="dropdown-visibility-formation" title="Visibilité Colonnes" style={iconButtonStyle}>
                  <FontAwesomeIcon icon={faSliders} style={{ width: 18, height: 18, color: "#4b5563" }} />
                </Dropdown.Toggle>
                <Dropdown.Menu as={CustomMenu} />
              </Dropdown>
            </div>
          </div>
        </div>
      </div>

      {filtersVisible && (
        <div className="filters-container" style={{ marginBottom: "18px", padding: "15px 25px", overflowX: "auto", whiteSpace: "nowrap", flexWrap: "nowrap", rowGap: "10px", display: "flex", alignItems: "center", gap: "18px" }}>
          <div className="filters-icon-section">
            <FontAwesomeIcon icon={faFilter} className="filters-icon" />
            <span className="filters-title">Filtres</span>
            <button
              type="button"
              onClick={onResetFilters}
              style={{ border: "1px solid #cbd5e1", background: "#fff", color: "#334155", borderRadius: "6px", height: "30px", padding: "0 10px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer", marginLeft: "8px", whiteSpace: "nowrap" }}
            >
              Réinitialiser
            </button>
          </div>

          <div className="filter-group" style={{ marginRight: "14px" }}>
            <label className="filter-label" style={{ width: "70px" }}>Nom</label>
            <Form.Control className="filter-input" placeholder="Nom employé" value={filters.search} onChange={(e) => handleFilterField("search", e.target.value)} style={{ width: "210px" }} />
          </div>

          <div className="filter-group" style={{ marginRight: "14px" }}>
            <label className="filter-label" style={{ width: "70px" }}>Statut</label>
            <Form.Select className="filter-input" value={filters.statut} onChange={(e) => handleFilterField("statut", e.target.value)} style={{ width: "185px" }}>
              <option value="">Tous les statuts</option>
              {STATUTS.map((item) => <option key={item} value={item}>{item}</option>)}
            </Form.Select>
          </div>

          <div className="filter-group" style={{ marginRight: "14px" }}>
            <label className="filter-label" style={{ width: "70px" }}>Urgence</label>
            <Form.Select className="filter-input" value={filters.urgence} onChange={(e) => handleFilterField("urgence", e.target.value)} style={{ width: "180px" }}>
              <option value="">Toutes</option>
              {URGENCES.map((item) => <option key={item} value={item}>{item}</option>)}
            </Form.Select>
          </div>

          <div className="filter-group" style={{ marginRight: "14px" }}>
            <label className="filter-label" style={{ width: "105px" }}>Département</label>
            <Form.Select className="filter-input" value={filters.departement_id} onChange={(e) => handleFilterField("departement_id", e.target.value)} style={{ width: "180px" }}>
              <option value="">Tous</option>
              {departements.map((dep) => <option key={dep.id} value={dep.id}>{dep.nom}</option>)}
            </Form.Select>
          </div>

          <div className="filter-group" style={{ marginRight: "14px" }}>
            <label className="filter-label" style={{ width: "90px" }}>Du</label>
            <Form.Control className="filter-input" type="date" value={filters.date_from} onChange={(e) => handleFilterField("date_from", e.target.value)} style={{ width: "160px" }} />
            <label className="filter-label" style={{ width: "35px", marginLeft: "8px" }}>Au</label>
            <Form.Control className="filter-input" type="date" value={filters.date_to} onChange={(e) => handleFilterField("date_to", e.target.value)} style={{ width: "160px" }} />
          </div>
        </div>
      )}

      {isEmpty ? (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "10px", padding: "36px 20px", textAlign: "center", color: "#6b7280", background: "#fff" }}>
          <div style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "12px", color: "#4b5563" }}>Aucune demande de formation pour le moment</div>
          <div>
            <Button
              onClick={onAdd}
              className="d-inline-flex align-items-center justify-content-center"
              size="sm"
              style={{
                minWidth: "220px",
                height: "38px",
                backgroundColor: "#3a8a90",
                border: "none",
                borderRadius: "8px",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.95rem",
                boxShadow: "0 3px 8px rgba(58, 138, 144, 0.28)",
                whiteSpace: "nowrap",
              }}
            >
              <FaPlusCircle className="me-2" />
              Créer une demande
            </Button>
          </div>
        </div>
      ) : (
        <ExpandRTable
          columns={visibleColumns}
          data={rows}
          page={page}
          rowsPerPage={rowsPerPage}
          handleChangePage={setPage}
          handleChangeRowsPerPage={(event) => {
            const nextRowsPerPage = parseInt(event?.target?.value, 10) || 10;
            setRowsPerPage(nextRowsPerPage);
            setPage(0);
          }}
          pagination={false}
          selectedItems={selectedItems}
          selectAll={rows.length > 0 && selectedItems.length === rows.length}
          onSelectAll={(checked) => setSelectedItems(checked ? rows.map((r) => r.id) : [])}
          onSelectItem={(id) => setSelectedItems((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))}
          handleEdit={onEdit}
          handleDelete={handleDeleteById}
          canBulkDelete={false}
          loading={loading && rows.length === 0}
          loadingText="Chargement des demandes de formation..."
          renderActions={(row) => (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView(row);
                }}
                aria-label="Voir"
                title="Voir détail"
                style={{ border: "none", backgroundColor: "transparent", cursor: "pointer" }}
              >
                <FontAwesomeIcon icon={faEye} style={{ color: "#17a2b8", fontSize: "14px" }} />
              </button>
            </>
          )}
          noDataMessage="Aucune donnée disponible"
        />
      )}
    </div>
  );
};

export default DemandeFormationTable;
