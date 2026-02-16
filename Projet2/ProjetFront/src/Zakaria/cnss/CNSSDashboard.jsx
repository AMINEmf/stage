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
import {
  Users,
  FileText,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { useHeader } from "../../Acceuil/HeaderContext";
import { useOpen } from "../../Acceuil/OpenProvider";

const API_BASE = window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : "http://127.0.0.1:8000";

const themeColors = {
  teal: "#2c767c",
  tealLight: "#4db6ac",
  tealDark: "#004d40",
  secondary: "#26a69a",
  success: "#4caf50",
  warning: "#ff9800",
  error: "#f44336",
  info: "#2196f3",
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  hoverBg: "#f8fafc",
  divider: "rgba(44, 118, 124, 0.2)", // teal at 20% opacity
};

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

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card
      sx={{
        background: `linear-gradient(135deg, ${color}08 0%, ${color}04 100%)`,
        borderRadius: "24px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: `1px solid ${color}15`,
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
          background: `linear-gradient(90deg, ${themeColors.teal}, ${themeColors.tealLight})`,
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box>
            <Typography
              variant="body2"
              sx={{
                color: themeColors.textSecondary,
                mb: 1,
                fontWeight: 500,
                fontSize: "0.875rem",
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 700,
                color: themeColors.tealDark,
                fontSize: { xs: "2rem", md: "2.5rem" },
                lineHeight: 1,
              }}
            >
              {loading ? "..." : value}
            </Typography>
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}26`, // 15% opacité approx (26 en hex matches 0.15 * 255)
              borderRadius: "16px",
              p: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={28} color={color} />
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
        icon: Users,
        color: themeColors.teal,
      },
      {
        title: "Déclarations EN_ATTENTE",
        value: data.declarations_en_attente ?? 0,
        icon: FileText,
        color: themeColors.secondary,
      },
      {
        title: "Masse salariale",
        value: (data.masse_salariale ?? 0).toLocaleString("fr-FR"),
        icon: TrendingUp,
        color: themeColors.tealLight,
      },
      {
        title: "Montant CNSS",
        value: (data.montant_cnss ?? 0).toLocaleString("fr-FR"),
        icon: DollarSign,
        color: themeColors.tealDark,
      },
    ];
  }, [dashboardData]);

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
      color: themeColors.warning,
    },
    {
      label: "DECLARE",
      count: statusCounts.declare,
      color: themeColors.info,
    },
    {
      label: "PAYE",
      count: statusCounts.paye,
      color: themeColors.success,
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

  const getStatusStyle = (status) => {
    const normalized = String(status || "").toUpperCase();
    if (["ACTIVE", "TERMINÉE", "PAYE"].includes(normalized))
      return { color: themeColors.success, bg: `${themeColors.success}33` };
    if (["EN_COURS", "EN_ATTENTE", "DECLARE"].includes(normalized))
      return { color: themeColors.warning, bg: `${themeColors.warning}33` };
    if (["RESILIE", "REFUSÉE", "ANNULÉE", "ERREUR"].includes(normalized))
      return { color: themeColors.error, bg: `${themeColors.error}33` };
    return { color: themeColors.textSecondary, bg: `${themeColors.textSecondary}33` };
  };

  const StatusChip = ({ status }) => {
    const style = getStatusStyle(status);
    return (
      <Chip
        label={status || "N/A"}
        size="small"
        sx={{
          backgroundColor: style.bg,
          color: style.color,
          fontWeight: 500,
          fontSize: "0.75rem",
          borderRadius: "8px",
          border: "none",
        }}
      />
    );
  };

  return (
    <ThemeProvider theme={createTheme()}>
      <Box
        sx={{
          ...dynamicStyles,
          backgroundColor: "#f8fafc",
          minHeight: "100vh",
          boxSizing: "border-box",
          p: 3,
        }}
      >
        <Toolbar />

        {/* Page Title */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontSize: "1.5rem", fontWeight: 700, color: themeColors.textPrimary }}>
            Dashboard CNSS
          </Typography>
          <Typography variant="body2" sx={{ color: themeColors.textSecondary, mt: 0.5 }}>
            Suivi des affiliations, déclarations et opérations
          </Typography>
        </Box>

        {/* KPI Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {kpis.map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item.title}>
              <StatCard
                title={item.title}
                value={item.value}
                icon={item.icon}
                color={item.color}
              />
            </Grid>
          ))}
        </Grid>

        {/* Tables Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Recent Declarations */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                borderRadius: "24px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: `1px solid ${themeColors.divider}`,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Box
                    sx={{
                      backgroundColor: `${themeColors.teal}26`,
                      borderRadius: "12px",
                      p: 1,
                      mr: 2,
                    }}
                  >
                    <FileText size={20} color={themeColors.teal} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", color: themeColors.textPrimary }}>
                    Dernières Déclarations
                  </Typography>
                </Box>

                <TableContainer>
                  <Table sx={{ border: "none" }}>
                    <TableHead>
                      <TableRow>
                        {["Période", "Masse salariale", "Montant CNSS", "Statut"].map((head) => (
                          <TableCell key={head} sx={{ border: "none", color: themeColors.textSecondary, fontWeight: 600, fontSize: "0.875rem" }}>
                            {head}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={4} sx={{ border: "none", textAlign: "center", py: 4 }}>Chargement...</TableCell></TableRow>
                      ) : declarationsList.length === 0 ? (
                        <TableRow><TableCell colSpan={4} sx={{ border: "none", textAlign: "center", py: 4 }}>Aucune donnée</TableCell></TableRow>
                      ) : (
                        declarationsList.slice(0, 5).map((row) => (
                          <TableRow key={row.id} sx={{ "&:hover": { backgroundColor: themeColors.hoverBg }, transition: "0.2s" }}>
                            <TableCell sx={{ border: "none", py: 2, fontWeight: 500, fontSize: "0.875rem" }}>
                              {row.mois}/{row.annee}
                            </TableCell>
                            <TableCell sx={{ border: "none", py: 2, color: themeColors.textSecondary, fontSize: "0.75rem" }}>
                              {formatAmount(row.masse_salariale)}
                            </TableCell>
                            <TableCell sx={{ border: "none", py: 2, color: themeColors.textSecondary, fontSize: "0.75rem" }}>
                              {formatAmount(row.montant_cnss)}
                            </TableCell>
                            <TableCell sx={{ border: "none", py: 2 }}>
                              <StatusChip status={row.statut} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Operations */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                borderRadius: "24px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: `1px solid ${themeColors.divider}`,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Box
                    sx={{
                      backgroundColor: `${themeColors.secondary}26`,
                      borderRadius: "12px",
                      p: 1,
                      mr: 2,
                    }}
                  >
                    <Calendar size={20} color={themeColors.secondary} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", color: themeColors.textPrimary }}>
                    Dernières Opérations
                  </Typography>
                </Box>

                <TableContainer>
                  <Table sx={{ border: "none" }}>
                    <TableHead>
                      <TableRow>
                        {["Date", "Type", "Employé", "Statut"].map((head) => (
                          <TableCell key={head} sx={{ border: "none", color: themeColors.textSecondary, fontWeight: 600, fontSize: "0.875rem" }}>
                            {head}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {loading ? (
                        <TableRow><TableCell colSpan={4} sx={{ border: "none", textAlign: "center", py: 4 }}>Chargement...</TableCell></TableRow>
                      ) : operationsList.length === 0 ? (
                        <TableRow><TableCell colSpan={4} sx={{ border: "none", textAlign: "center", py: 4 }}>Aucune donnée</TableCell></TableRow>
                      ) : (
                        operationsList.slice(0, 5).map((row) => (
                          <TableRow key={row.id} sx={{ "&:hover": { backgroundColor: themeColors.hoverBg }, transition: "0.2s" }}>
                            <TableCell sx={{ border: "none", py: 2, fontSize: "0.875rem" }}>
                              {row.date_operation}
                            </TableCell>
                            <TableCell sx={{ border: "none", py: 2, fontWeight: 500, fontSize: "0.875rem" }}>
                              {row.type_operation}
                            </TableCell>
                            <TableCell sx={{ border: "none", py: 2, color: themeColors.textSecondary, fontSize: "0.75rem" }}>
                              {row.employe?.nom || "-"}
                            </TableCell>
                            <TableCell sx={{ border: "none", py: 2 }}>
                              <StatusChip status={row.statut} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Status Graph Section */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                borderRadius: "24px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: `1px solid ${themeColors.divider}`,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Box
                    sx={{
                      backgroundColor: `${themeColors.info}26`,
                      borderRadius: "12px",
                      p: 1,
                      mr: 2,
                    }}
                  >
                    <CheckCircle size={20} color={themeColors.info} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", color: themeColors.textPrimary }}>
                    Répartition des Statuts
                  </Typography>
                </Box>

                {statusRows.map((row) => (
                  <Box key={row.label} sx={{ mb: 2.5 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: themeColors.textPrimary }}>
                        {row.label}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: row.color }}>
                        {row.count} ({row.percentage}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={row.percentage}
                      sx={{
                        height: 6,
                        borderRadius: "10px",
                        backgroundColor: "#e2e8f0",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor: row.color,
                          borderRadius: "10px",
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
    </ThemeProvider>
  );
};

export default CNSSDashboard;