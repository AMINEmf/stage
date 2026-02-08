import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  Typography,
  ThemeProvider,
  createTheme,
  Box,
  Grid,
  Toolbar,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import DescriptionIcon from "@mui/icons-material/Description";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import AttachMoneyTwoToneIcon from "@mui/icons-material/AttachMoneyTwoTone";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { useHeader } from "../../Acceuil/HeaderContext";
import { useOpen } from "../../Acceuil/OpenProvider";

const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : "http://127.0.0.1:8000";

const CNSSDashboard = () => {
  const { setTitle, clearActions } = useHeader();
  const { dynamicStyles } = useOpen();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    period: { mois: null, annee: null },
    kpis: {
      affiliations_actif: 0,
      declarations_en_attente: 0,
      masse_salariale: 0,
      montant_cnss: 0,
    },
    status_breakdown: { en_attente: 0, declare: 0, paye: 0 },
    tables: { declarations: [], operations: [] },
  });

  useEffect(() => {
    setTitle("Dashboard CNSS");
    return () => {
      clearActions();
    };
  }, [setTitle, clearActions]);

  const theme = {
    primary: "#00695c",
    primaryLight: "#4db6ac",
    primaryDark: "#004d40",
    secondary: "#26a69a",
    accent: "#00bcd4",
    success: "#4caf50",
    warning: "#ff9800",
    error: "#f44336",
    info: "#2196f3",
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const mois = today.getMonth() + 1;
        const annee = today.getFullYear();
        const response = await axios.get(`${API_BASE}/api/cnss/dashboard`, {
          params: { mois, annee },
        });
        setDashboardData(response.data);
      } catch (error) {
        console.error("Erreur lors du chargement du dashboard CNSS:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const StatCard = ({ title, value, icon: Icon, bgColor, textColor, iconBg }) => (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${bgColor}08 0%, ${bgColor}04 100%)`,
        borderRadius: 3,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: `1px solid ${bgColor}15`,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: `linear-gradient(90deg, ${bgColor}, ${bgColor}80)`,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="body2"
              sx={{
                color: "#64748b",
                mb: 1.5,
                fontWeight: 500,
                fontSize: "0.875rem",
              }}
            >
              {title}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", mb: 1 }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 700,
                  color: textColor,
                  fontSize: { xs: "2rem", sm: "2.5rem" },
                  lineHeight: 1,
                }}
              >
                {loading ? "..." : value}
              </Typography>
            </Box>
          </Box>
          <Box
            sx={{
              backgroundColor: iconBg,
              borderRadius: "16px",
              p: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 8px 16px ${bgColor}20`,
            }}
          >
            <Icon sx={{ fontSize: 32, color: textColor }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const kpis = useMemo(() => {
    const data = dashboardData?.kpis || {};
    return [
      {
        title: "Affiliations Actives",
        value: data.affiliations_actif ?? 0,
        icon: PeopleAltIcon,
        color: theme.primary,
      },
      {
        title: "Déclarations EN_ATTENTE",
        value: data.declarations_en_attente ?? 0,
        icon: DescriptionIcon,
        color: theme.secondary,
      },
      {
        title: "Masse salariale (mois en cours)",
        value: data.masse_salariale ?? 0,
        icon: TrendingUpIcon,
        color: theme.accent,
      },
      {
        title: "Montant CNSS (mois en cours)",
        value: data.montant_cnss ?? 0,
        icon: AttachMoneyTwoToneIcon,
        color: theme.primaryLight,
      },
    ];
  }, [dashboardData, theme]);

  const statusCounts = dashboardData?.status_breakdown || {
    en_attente: 0,
    declare: 0,
    paye: 0,
  };
  const totalStatus = statusCounts.en_attente + statusCounts.declare + statusCounts.paye;

  const statusRows = [
    {
      label: "EN_ATTENTE",
      count: statusCounts.en_attente,
      color: theme.warning,
    },
    {
      label: "DECLARE",
      count: statusCounts.declare,
      color: theme.info,
    },
    {
      label: "PAYE",
      count: statusCounts.paye,
      color: theme.success,
    },
  ].map((row) => ({
    ...row,
    percentage: totalStatus > 0 ? Math.round((row.count / totalStatus) * 100) : 0,
  }));

  const declarationsList = dashboardData?.tables?.declarations || [];
  const operationsList = dashboardData?.tables?.operations || [];

  const formatAmount = (value) => {
    const numeric = Number(value ?? 0);
    if (!Number.isFinite(numeric)) return "0";
    return numeric.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const declarationStatusStyle = (status) => {
    const normalized = String(status || "").toUpperCase();
    if (normalized === "PAYE") return { bg: `${theme.success}20`, color: theme.success };
    if (normalized === "DECLARE") return { bg: `${theme.info}20`, color: theme.info };
    return { bg: `${theme.warning}20`, color: theme.warning };
  };

  const operationStatusStyle = (status) => {
    const normalized = String(status || "").toUpperCase();
    if (normalized === "TERMINEE") return { bg: `${theme.success}20`, color: theme.success };
    if (normalized === "ANNULEE") return { bg: `${theme.error}20`, color: theme.error };
    return { bg: `${theme.warning}20`, color: theme.warning };
  };

  return (
    <ThemeProvider theme={createTheme()}>
      <Box
        sx={{
          ...dynamicStyles,
          backgroundColor: "#f8fafc",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />

          <Grid container spacing={3} sx={{ mb: 4 }}>
            {kpis.map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item.title}>
                <StatCard
                  title={item.title}
                  value={item.value}
                  icon={item.icon}
                  bgColor={item.color}
                  textColor={theme.primaryDark}
                  iconBg={`${item.color}15`}
                />
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  border: `1px solid ${theme.primary}20`,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <Box
                      sx={{
                        backgroundColor: `${theme.primary}15`,
                        borderRadius: 2,
                        p: 1.5,
                        mr: 2,
                      }}
                    >
                      <DescriptionIcon sx={{ color: theme.primary, fontSize: 24 }} />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "#1e293b",
                        fontSize: "1.1rem",
                      }}
                    >
                      Dernières Déclarations CNSS
                    </Typography>
                  </Box>

                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, color: "#64748b", border: "none", pb: 2 }}>
                            Période
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: "#64748b", border: "none", pb: 2 }}>
                            Masse salariale
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: "#64748b", border: "none", pb: 2 }}>
                            Montant CNSS
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: "#64748b", border: "none", pb: 2 }}>
                            Statut
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={4} sx={{ border: "none", color: "#64748b" }}>
                              Chargement...
                            </TableCell>
                          </TableRow>
                        ) : declarationsList.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} sx={{ border: "none", color: "#64748b" }}>
                              Aucune déclaration trouvée.
                            </TableCell>
                          </TableRow>
                        ) : (
                          declarationsList.map((item) => {
                            const style = declarationStatusStyle(item.statut);
                            return (
                              <TableRow key={item.id} sx={{ "& td": { border: "none", py: 1.5 } }}>
                                <TableCell sx={{ color: "#1e293b", fontSize: "0.875rem" }}>
                                  {item.mois}/{item.annee}
                                </TableCell>
                                <TableCell sx={{ color: "#1e293b", fontSize: "0.875rem" }}>
                                  {formatAmount(item.masse_salariale)}
                                </TableCell>
                                <TableCell sx={{ color: "#1e293b", fontSize: "0.875rem" }}>
                                  {formatAmount(item.montant_cnss)}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={item.statut || "EN_ATTENTE"}
                                    size="small"
                                    sx={{
                                      backgroundColor: style.bg,
                                      color: style.color,
                                      fontWeight: 500,
                                      fontSize: "0.75rem",
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  border: `1px solid ${theme.primary}20`,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <Box
                      sx={{
                        backgroundColor: `${theme.secondary}15`,
                        borderRadius: 2,
                        p: 1.5,
                        mr: 2,
                      }}
                    >
                      <ScheduleIcon sx={{ color: theme.secondary, fontSize: 24 }} />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "#1e293b",
                        fontSize: "1.1rem",
                      }}
                    >
                      Dernières opérations CNSS
                    </Typography>
                  </Box>

                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, color: "#64748b", border: "none", pb: 2 }}>
                            Date
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: "#64748b", border: "none", pb: 2 }}>
                            Type
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: "#64748b", border: "none", pb: 2 }}>
                            Employé
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, color: "#64748b", border: "none", pb: 2 }}>
                            Statut
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={4} sx={{ border: "none", color: "#64748b" }}>
                              Chargement...
                            </TableCell>
                          </TableRow>
                        ) : operationsList.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} sx={{ border: "none", color: "#64748b" }}>
                              Aucune opération trouvée.
                            </TableCell>
                          </TableRow>
                        ) : (
                          operationsList.map((item) => {
                            const style = operationStatusStyle(item.statut);
                            const employeLabel = [item.employe?.nom, item.employe?.matricule]
                              .filter(Boolean)
                              .join(" - ");
                            return (
                              <TableRow key={item.id} sx={{ "& td": { border: "none", py: 1.5 } }}>
                                <TableCell sx={{ color: "#1e293b", fontSize: "0.875rem" }}>
                                  {item.date_operation || "-"}
                                </TableCell>
                                <TableCell sx={{ color: "#1e293b", fontSize: "0.875rem" }}>
                                  {item.type_operation || "-"}
                                </TableCell>
                                <TableCell sx={{ color: "#1e293b", fontSize: "0.875rem" }}>
                                  {employeLabel || "-"}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={item.statut || "EN_COURS"}
                                    size="small"
                                    sx={{
                                      backgroundColor: style.bg,
                                      color: style.color,
                                      fontWeight: 500,
                                      fontSize: "0.75rem",
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  border: `1px solid ${theme.primary}20`,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <Box
                      sx={{
                        backgroundColor: `${theme.primaryLight}15`,
                        borderRadius: 2,
                        p: 1.5,
                        mr: 2,
                      }}
                    >
                      <DescriptionIcon sx={{ color: theme.primaryLight, fontSize: 24 }} />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "#1e293b",
                        fontSize: "1.1rem",
                      }}
                    >
                      Statuts Déclarations (mois en cours)
                    </Typography>
                  </Box>

                  {statusRows.map((row) => (
                    <Box key={row.label} sx={{ mb: 3 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: "#1e293b",
                            fontSize: "0.875rem",
                          }}
                        >
                          {row.label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "#64748b", fontSize: "0.875rem" }}>
                          {row.count} ({row.percentage}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={row.percentage}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: "#e2e8f0",
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: row.color,
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default CNSSDashboard;
