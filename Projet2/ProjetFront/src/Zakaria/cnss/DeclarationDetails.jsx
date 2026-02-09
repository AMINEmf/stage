import React, { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { Table, Spinner, Badge } from "react-bootstrap";
import Swal from "sweetalert2";
import { FileText, Calendar, DollarSign, Users, TrendingUp } from "lucide-react";
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
    <div className="addemp-overlay" style={{ 
      width: '100%', 
      height: '100%',
      position: 'relative',
      top: 0,
      left: 0,
      zIndex: 'auto',
      overflow: 'hidden'
    }}>
      <div className="addper" style={{ height: '100%' }}>
        <div className="employee-body" style={{ margin: 0, padding: 0, overflowX: "hidden", height: '100%' }}>
          <div style={{ position: "relative", height: '100%', display: 'flex', flexDirection: 'column' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                position: "absolute",
                top: "15px",
                right: "20px",
                background: "transparent",
                border: "none",
                fontSize: "2rem",
                color: "#4b5563",
                cursor: "pointer",
                zIndex: 9999,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#dc3545")}
              onMouseLeave={(e) => (e.target.style.color = "#4b5563")}
              aria-label="Fermer le panneau des détails"
            >
              &times;
            </button>

            <div style={{ padding: "25px 30px", flex: 1, overflowY: 'auto' }}>
              {/* En-tête avec icône */}
              <div className="section-header" style={{ marginBottom: "25px" }}>
                <h3 className="section-title" style={{ color: "#2c3e50", fontWeight: "600", display: "flex", alignItems: "center", gap: "12px" }}>
                  <FileText size={28} style={{ color: "#00afaa" }} />
                  Détails Déclaration CNSS
                </h3>
              </div>

              {/* Cartes d'information */}
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div style={{
                    padding: "18px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    color: "white",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    transition: "transform 0.2s",
                    cursor: "default"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <Calendar size={20} />
                      <div style={{ fontSize: "13px", opacity: "0.95", fontWeight: "500" }}>Période</div>
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: "700" }}>
                      {summary.mois} {summary.annee}
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div style={{
                    padding: "18px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                    color: "white",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    transition: "transform 0.2s",
                    cursor: "default"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <TrendingUp size={20} />
                      <div style={{ fontSize: "13px", opacity: "0.95", fontWeight: "500" }}>Masse salariale</div>
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: "700" }}>
                      {summary.masse}
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div style={{
                    padding: "18px",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                    color: "white",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    transition: "transform 0.2s",
                    cursor: "default"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                      <DollarSign size={20} />
                      <div style={{ fontSize: "13px", opacity: "0.95", fontWeight: "500" }}>Montant CNSS</div>
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: "700" }}>
                      {summary.montant}
                    </div>
                  </div>
                </div>
              </div>

              {/* Badge de statut */}
              <div className="mb-4">
                <Badge 
                  bg={summary.statut === "DECLARE" ? "success" : summary.statut === "EN_ATTENTE" ? "warning" : "secondary"}
                  style={{ 
                    fontSize: "14px", 
                    padding: "8px 16px",
                    fontWeight: "500",
                    borderRadius: "6px",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)"
                  }}
                >
                  {summary.statut}
                </Badge>
              </div>

              {/* Section employés */}
              <div className="section-header" style={{ marginTop: "30px", marginBottom: "20px" }}>
                <h5 className="section-title" style={{ color: "#2c3e50", fontWeight: "600", display: "flex", alignItems: "center", gap: "10px", fontSize: "18px" }}>
                  <Users size={22} style={{ color: "#00afaa" }} />
                  Employés déclarés
                </h5>
              </div>

              {loading ? (
                <div className="d-flex align-items-center gap-2 text-muted" style={{ padding: "20px" }}>
                  <Spinner animation="border" size="sm" style={{ color: "#00afaa" }} />
                  <span>Chargement des détails...</span>
                </div>
              ) : (
                <div style={{ 
                  background: "#fff",
                  borderRadius: "8px",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                  overflow: "hidden"
                }}>
                  <div style={{ overflowX: "auto" }}>
                    <Table hover className="mb-0" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
                      <thead style={{ background: "#f8f9fa" }}>
                        <tr>
                          <th style={{ 
                            padding: "14px 16px", 
                            borderBottom: "2px solid #dee2e6", 
                            color: "#2c3e50", 
                            fontWeight: "600",
                            fontSize: "14px"
                          }}>Matricule</th>
                          <th style={{ 
                            padding: "14px 16px", 
                            borderBottom: "2px solid #dee2e6", 
                            color: "#2c3e50", 
                            fontWeight: "600",
                            fontSize: "14px"
                          }}>Employé</th>
                          <th style={{ 
                            padding: "14px 16px", 
                            borderBottom: "2px solid #dee2e6", 
                            color: "#2c3e50", 
                            fontWeight: "600",
                            fontSize: "14px"
                          }}>N° CNSS</th>
                          <th style={{ 
                            padding: "14px 16px", 
                            borderBottom: "2px solid #dee2e6", 
                            color: "#2c3e50", 
                            fontWeight: "600",
                            fontSize: "14px",
                            textAlign: "right"
                          }}>Salaire</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length > 0 ? (
                          rows.map((row, index) => (
                            <tr 
                              key={row.id}
                              style={{ 
                                borderBottom: index !== rows.length - 1 ? "1px solid #f0f0f0" : "none",
                                transition: "background-color 0.2s"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                              <td style={{ padding: "12px 16px", color: "#495057", fontSize: "14px" }}>
                                <span style={{ 
                                  background: "#e9ecef",
                                  padding: "4px 10px",
                                  borderRadius: "4px",
                                  fontWeight: "500"
                                }}>
                                  {row.matricule || "-"}
                                </span>
                              </td>
                              <td style={{ padding: "12px 16px", color: "#495057", fontSize: "14px", fontWeight: "500" }}>
                                {`${row.nom || ""} ${row.prenom || ""}`.trim() || "-"}
                              </td>
                              <td style={{ padding: "12px 16px", color: "#6c757d", fontSize: "14px" }}>
                                {row.numero_cnss || "-"}
                              </td>
                              <td style={{ 
                                padding: "12px 16px", 
                                color: "#00afaa", 
                                fontSize: "14px", 
                                fontWeight: "600",
                                textAlign: "right"
                              }}>
                                {formatCurrency(row.salaire)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "#6c757d" }}>
                              <Users size={48} style={{ opacity: "0.3", marginBottom: "10px" }} />
                              <div style={{ fontSize: "15px" }}>Aucun employé déclaré pour cette période.</div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
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
