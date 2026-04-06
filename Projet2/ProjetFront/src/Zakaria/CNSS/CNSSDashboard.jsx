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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart, pieArcLabelClasses } from "@mui/x-charts/PieChart";
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

const API_BASE = globalThis.location.hostname === "localhost"
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

const CNSS_DASHBOARD_CACHE_KEY = "dashboard-cnss-cache-v1";
const CACHE_TTL = 5 * 60 * 1000;

const readCnssDashboardCache = () => {
  try {
    const raw = globalThis.localStorage.getItem(CNSS_DASHBOARD_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch (error) {
    console.warn("CNSS dashboard cache invalide:", error);
    return null;
  }
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
    setTitle("Tableau de bord CNSS");
    return () => {
      clearActions();
    };
  }, [setTitle, clearActions]);

  useEffect(() => {
    const fetchDashboard = async () => {
      let hasCachedData = false;

      const cached = readCnssDashboardCache();
      if (cached?.data) {
        setDashboardData(cached.data);
        setLoading(false);
        hasCachedData = true;

        const isFresh = cached?.timestamp && Date.now() - Number(cached.timestamp) < CACHE_TTL;
        if (isFresh) {
          return;
        }
      }

      if (!hasCachedData) {
        setLoading(true);
      }
      try {
        const today = new Date();
        const mois = today.getMonth() + 1;
        const annee = today.getFullYear();
        const response = await axios.get(`${API_BASE}/api/cnss/dashboard`, {
          params: { mois, annee },
        });
        setDashboardData(response.data);
        try {
          globalThis.localStorage.setItem(
            CNSS_DASHBOARD_CACHE_KEY,
            JSON.stringify({
              data: response.data,
              timestamp: Date.now(),
            })
          );
        } catch (cacheError) {
          console.warn("Impossible d'enregistrer le cache CNSS:", cacheError);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du dashboard CNSS:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const StatCard = ({ title, value, subtitle, icon: Icon, bgGradient }) => (
    <Card
      sx={{
        background: bgGradient,
        borderRadius: "20px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        position: "relative",
        overflow: "hidden",
        transition: "all 0.3s ease",
        cursor: "pointer",
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
        },
      }}
    >
      <CardContent sx={{ p: 3, position: "relative", zIndex: 1 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.85)",
                mb: 1,
                fontWeight: 500,
                fontSize: "0.85rem",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {title}
            </Typography>
            <Typography
              sx={{
                fontWeight: 700,
                color: "#fff",
                fontSize: { xs: "2rem", sm: "2.2rem", md: "2.4rem" },
                lineHeight: 1.1,
                mb: 0.5,
              }}
            >
              {loading ? "..." : value}
            </Typography>
            {subtitle ? (
              <Typography
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "0.8rem",
                }}
              >
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          <Box
            sx={{
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: "16px",
              p: 2,
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={30} color="#fff" />
          </Box>
        </Box>
      </CardContent>
      <Box
        sx={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 150,
          height: 150,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.1)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -30,
          right: 30,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
        }}
      />
    </Card>
  );

  const kpis = useMemo(() => {
    const data = dashboardData?.kpis || {};
    return [
      {
        title: "Affiliations Actives",
        value: data.affiliations_actif ?? 0,
        icon: Users,
        subtitle: "Employés affiliés",
        bgGradient: "linear-gradient(135deg, #2c767c 0%, #4db6ac 100%)",
      },
      {
        title: "Déclarations EN_ATTENTE",
        value: data.declarations_en_attente ?? 0,
        icon: FileText,
        subtitle: "Dossiers en attente",
        bgGradient: "linear-gradient(135deg, #26a69a 0%, #00897b 100%)",
      },
      {
        title: "Masse salariale",
        value: `${(data.masse_salariale ?? 0).toLocaleString("fr-FR")} DH`,
        icon: TrendingUp,
        subtitle: "Base de cotisation",
        bgGradient: "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
      },
      {
        title: "Montant CNSS",
        value: `${(data.montant_cnss ?? 0).toLocaleString("fr-FR")} DH`,
        icon: DollarSign,
        subtitle: "Cotisations à verser",
        bgGradient: "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)",
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
  ];

  const declarationsList = dashboardData?.tables?.declarations || [];
  const operationsList = dashboardData?.tables?.operations || [];

  const statusPieData = statusRows
    .filter((row) => row.count > 0)
    .map((row, index) => ({
      id: index,
      value: row.count,
      label: row.label,
      color: row.color,
    }));

  const monthlyCnssData = useMemo(() => {
    const monthNames = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aout", "Sep", "Oct", "Nov", "Dec"];
    const groupedByMonth = new Map();

    declarationsList.forEach((row) => {
      const month = Number(row?.mois);
      const year = Number(row?.annee);
      if (!Number.isFinite(month) || !Number.isFinite(year) || month < 1 || month > 12) {
        return;
      }

      const key = `${year}-${String(month).padStart(2, "0")}`;
      const previous = groupedByMonth.get(key) || 0;
      const next = previous + Number(row?.montant_cnss || 0);
      groupedByMonth.set(key, next);
    });

    const sortedEntries = [...groupedByMonth.entries()].sort(([a], [b]) => a.localeCompare(b));

    return {
      labels: sortedEntries.map(([key]) => {
        const [year, month] = key.split("-");
        return `${monthNames[Number(month) - 1]} ${year}`;
      }),
      values: sortedEntries.map(([, value]) => Number(value.toFixed(2))),
    };
  }, [declarationsList]);

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
    if (["ACTIVE", "ACTIF", "TERMINÉE", "TERMINEE", "PAYE"].includes(normalized))
      return { color: themeColors.success, bg: `${themeColors.success}15` };
    if (["EN_COURS", "EN_ATTENTE", "DECLARE"].includes(normalized))
      return { color: themeColors.warning, bg: `${themeColors.warning}15` };
    if (["RESILIE", "REFUSÉE", "ANNULÉE", "ERREUR", "SUSPENDU", "INACTIF"].includes(normalized))
      return { color: themeColors.error, bg: `${themeColors.error}15` };
    return { color: themeColors.textSecondary, bg: `${themeColors.textSecondary}15` };
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
          fontWeight: 700,
          fontSize: "0.65rem",
          borderRadius: "6px",
          border: "none",
          height: "1.5rem",
          textTransform: "uppercase",
          letterSpacing: "0.3px"
        }}
      />
    );
  };

  return (
    <ThemeProvider theme={createTheme()}>
      <Box
        sx={{
          ...dynamicStyles,
          backgroundColor: "#ffffff",
          height: "100vh",
          overflowY: "auto",
          minHeight: "100vh",
          boxSizing: "border-box",
          p: { xs: "1rem", sm: "1.5rem", md: "2rem" },
          "&::-webkit-scrollbar": {
            width: "0.5rem",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#cbd5e1",
            borderRadius: "0.25rem",
          },
        }}
      >
        <Toolbar />

        {/* Page Title */}
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontWeight: 800, color: themeColors.textPrimary, fontSize: "1.75rem", mb: 0.5 }}>
            Tableau de bord CNSS
          </Typography>
          <Typography sx={{ color: themeColors.textSecondary, fontSize: "0.95rem" }}>
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
                  subtitle={item.subtitle}
                  bgGradient={item.bgGradient}
              />
            </Grid>
          ))}
        </Grid>

        {/* Graphiques */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} lg={8}>
            <Card
              sx={{
                borderRadius: "20px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Box
                    sx={{
                      backgroundColor: `${themeColors.teal}15`,
                      borderRadius: "12px",
                      p: 1.5,
                      mr: 2,
                    }}
                  >
                    <TrendingUp size={20} color={themeColors.teal} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", color: themeColors.textPrimary }}>
                    Evolution Montant CNSS
                  </Typography>
                </Box>

                {monthlyCnssData.labels.length > 0 ? (
                  <Box sx={{ height: 300, width: "100%" }}>
                    <BarChart
                      xAxis={[
                        {
                          scaleType: "band",
                          data: monthlyCnssData.labels,
                          tickLabelStyle: {
                            fontSize: 12,
                            fill: themeColors.textSecondary,
                          },
                        },
                      ]}
                      series={[
                        {
                          data: monthlyCnssData.values,
                          color: themeColors.teal,
                          label: "Montant CNSS (DH)",
                        },
                      ]}
                      height={280}
                      sx={{
                        "& .MuiChartsAxis-line": { stroke: "#e2e8f0" },
                        "& .MuiChartsAxis-tick": { stroke: "#e2e8f0" },
                      }}
                      margin={{ left: 70, right: 20, top: 20, bottom: 40 }}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      height: 280,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f8fafc",
                      borderRadius: "12px",
                    }}
                  >
                    <Typography sx={{ color: themeColors.textSecondary }}>
                      Aucune donnée disponible
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Card
              sx={{
                borderRadius: "20px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.05)",
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Box
                    sx={{
                      backgroundColor: `${themeColors.info}15`,
                      borderRadius: "12px",
                      p: 1.5,
                      mr: 2,
                    }}
                  >
                    <CheckCircle size={20} color={themeColors.info} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", color: themeColors.textPrimary }}>
                    Statuts Déclarations
                  </Typography>
                </Box>

                {statusPieData.length > 0 ? (
                  <Box sx={{ height: 280, display: "flex", justifyContent: "center" }}>
                    <PieChart
                      series={[
                        {
                          data: statusPieData,
                          innerRadius: 50,
                          outerRadius: 100,
                          paddingAngle: 2,
                          cornerRadius: 5,
                          arcLabel: (item) => `${item.value}`,
                          arcLabelMinAngle: 30,
                        },
                      ]}
                      sx={{
                        [`& .${pieArcLabelClasses.root}`]: {
                          fill: "#fff",
                          fontWeight: "bold",
                          fontSize: 14,
                        },
                      }}
                      width={280}
                      height={280}
                      slotProps={{
                        legend: {
                          direction: "row",
                          position: { vertical: "bottom", horizontal: "middle" },
                          padding: 0,
                          itemMarkWidth: 10,
                          itemMarkHeight: 10,
                          markGap: 5,
                          itemGap: 10,
                          labelStyle: {
                            fontSize: 11,
                            fill: themeColors.textSecondary,
                          },
                        },
                      }}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      height: 280,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f8fafc",
                      borderRadius: "12px",
                    }}
                  >
                    <Typography sx={{ color: themeColors.textSecondary }}>
                      Aucun statut disponible
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tables Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Recent Declarations */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                  borderRadius: "20px",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                  border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <CardContent sx={{ p: "1.5rem" }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
                  <Box
                    sx={{
                        backgroundColor: `${themeColors.teal}15`,
                      borderRadius: "0.75rem",
                        p: "0.75rem",
                      display: "flex",
                      alignItems: "center"
                    }}
                  >
                    <FileText size={20} color={themeColors.teal} />
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: "1.1rem", color: themeColors.textPrimary }}>
                    Dernières Déclarations
                  </Typography>
                </Box>

                <TableContainer sx={{ overflowX: "auto" }}>
                  <Table sx={{ border: "none", minWidth: "400px" }}>
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
                  borderRadius: "20px",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                  border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                  <Box
                    sx={{
                        backgroundColor: `${themeColors.secondary}15`,
                      borderRadius: "12px",
                        p: 1.5,
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


      </Box>
    </ThemeProvider>
  );
};

export default CNSSDashboard;
