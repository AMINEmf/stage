import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { Table, Spinner } from "react-bootstrap";
import Swal from "sweetalert2";
import "../Employe/AddEmp.css";

const monthLabelFromNumber = (monthValue) => {
  const month = Number(monthValue);
  const labels = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
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

function DeclarationDetails({ declaration, onClose }) {
  const [loading, setLoading] = useState(false);
  const [detailsData, setDetailsData] = useState(null);

  const fetchDeclarationDetails = useCallback(async () => {
    if (!declaration?.id) {
      setDetailsData(null);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/cnss/declarations/${declaration.id}`);
      setDetailsData(response.data || null);
    } catch (error) {
      console.error("Erreur lors de la récupération des détails de déclaration:", error);
      Swal.fire("Erreur", "Impossible de charger les détails de la déclaration.", "error");
      setDetailsData(null);
    } finally {
      setLoading(false);
    }
  }, [declaration]);

  useEffect(() => {
    fetchDeclarationDetails();
  }, [fetchDeclarationDetails]);

  const summary = useMemo(() => {
    const data = detailsData || declaration || {};
    return {
      mois: monthLabelFromNumber(data.mois),
      annee: data.annee || "-",
      statut: data.statut || "-",
      masse: formatCurrency(data.masse_salariale),
      montant: formatCurrency(data.montant_total),
    };
  }, [detailsData, declaration]);

  const rows = useMemo(() => {
    if (!detailsData?.details || !Array.isArray(detailsData.details)) return [];
    return detailsData.details;
  }, [detailsData]);

  return (
    <div className="addemp-overlay" style={{ width: '50%', left: '50%', position: 'fixed', right: 0, top: '9.4%', height: 'calc(100vh - 160px)', zIndex: 1000 }}>
      <div className="addper" style={{ height: '100%' }}>
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
              aria-label="Fermer le panneau des détails"
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
                Détails Déclaration CNSS
              </h3>

              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="p-3 border rounded bg-light">
                    <div className="text-muted">Période</div>
                    <div className="fw-bold">
                      {summary.mois} {summary.annee}
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-3 border rounded bg-light">
                    <div className="text-muted">Masse salariale</div>
                    <div className="fw-bold">{summary.masse}</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-3 border rounded bg-light">
                    <div className="text-muted">Montant CNSS</div>
                    <div className="fw-bold">{summary.montant}</div>
                  </div>
                </div>
              </div>

              <div className="mb-2">
                <span className="badge bg-secondary">{summary.statut}</span>
              </div>

              {loading ? (
                <div className="d-flex align-items-center gap-2 text-muted">
                  <Spinner animation="border" size="sm" />
                  Chargement des détails...
                </div>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Matricule</th>
                        <th>Employé</th>
                        <th>N° CNSS</th>
                        <th>Salaire</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length > 0 ? (
                        rows.map((row) => (
                          <tr key={row.id}>
                            <td>{row.matricule || "-"}</td>
                            <td>{`${row.nom || ""} ${row.prenom || ""}`.trim() || "-"}</td>
                            <td>{row.numero_cnss || "-"}</td>
                            <td>{formatCurrency(row.salaire)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center text-muted">
                            Aucun employé déclaré pour cette période.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeclarationDetails;
