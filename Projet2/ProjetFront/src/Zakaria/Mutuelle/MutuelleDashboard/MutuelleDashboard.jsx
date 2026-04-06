import React, { useEffect, useState, useMemo } from "react";
import apiClient from "../../../services/apiClient";
import { useHeader } from "../../../Acceuil/HeaderContext";
import { useOpen } from "../../../Acceuil/OpenProvider";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  ThemeProvider,
  createTheme,
  CssBaseline,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme
} from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart, pieArcLabelClasses } from "@mui/x-charts/PieChart";
import {
  Users,
  FileText,
  CheckCircle,
  TrendingUp,
  Calendar,
  AlertCircle,
  XCircle,
  Clock,
  ArrowRight,
  TrendingDown
} from "lucide-react";

// --- Configuration & Styling ---

const COLORS = {
  primary: "#2c767c",
  primaryLight: "#4db6ac",
  primaryDark: "#004d40",
  secondary: "#26a69a",
  success: "#4caf50",
  warning: "#ff9800",
  error: "#f44336",
  info: "#2196f3",
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  hoverBg: "#f8fafc",
  bg: "#ffffff"
};

const theme = createTheme({
  palette: {
    primary: { main: COLORS.primary, light: COLORS.primaryLight, dark: COLORS.primaryDark },
    secondary: { main: COLORS.secondary },
    success: { main: COLORS.success },
    warning: { main: COLORS.warning },
    error: { main: COLORS.error },
    info: { main: COLORS.info },
    text: { primary: COLORS.textPrimary, secondary: COLORS.textSecondary },
    background: { default: COLORS.bg, paper: "#ffffff" }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, color: COLORS.textPrimary },
    h5: { fontWeight: 600, color: COLORS.textPrimary },
    h6: { fontWeight: 600, color: COLORS.textPrimary },
    subtitle1: { color: COLORS.textSecondary },
    subtitle2: { color: COLORS.textSecondary, fontWeight: 500 },
    body1: { color: COLORS.textPrimary },
    body2: { color: COLORS.textPrimary }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: COLORS.textSecondary,
          fontWeight: 600,
          borderBottom: `1px solid ${COLORS.primary}20`,
        },
        body: {
          paddingTop: 16,
          paddingBottom: 16,
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        }
      }
    }
  }
});

const api = apiClient;

const EMPTY_MUTUELLE_DASHBOARD = {
  kpis: {
    affiliations_actives: 0,
    affiliations_inactives: 0,
    dossiers_en_cours: 0,
    dossiers_termines: 0,
  },
  latest_affiliations: [],
  latest_dossiers: [],
  distribution: { EN_COURS: 0, TERMINEE: 0, ANNULEE: 0, total: 0 },
};

// --- Components ---

const StatCard = ({ title, value, subtitle, icon: Icon, bgGradient }) => (
  <Card
    sx={{
      position: 'relative',
      overflow: 'hidden',
      background: bgGradient,
      borderRadius: '20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
      },
      transition: 'all 0.3s ease',
      cursor: 'pointer',
    }}
  >
    <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.85)',
              mb: 1,
              fontWeight: 500,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontWeight: 700,
              color: '#fff',
              fontSize: { xs: '2rem', sm: '2.2rem', md: '2.4rem' },
              lineHeight: 1.1,
              mb: 0.5,
            }}
          >
            {value}
          </Typography>
          {subtitle ? (
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
              {subtitle}
            </Typography>
          ) : null}
        </Box>
        <Box
          sx={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            p: 2,
            borderRadius: '16px',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Icon size={30} />
        </Box>
      </Box>
    </CardContent>
    <Box
      sx={{
        position: 'absolute',
        top: -50,
        right: -50,
        width: 150,
        height: 150,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        bottom: -30,
        right: 30,
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
      }}
    />
  </Card>
);

const StatusBadge = ({ status }) => {
  const s = status ? status.toUpperCase().trim() : "INCONNU";

  const labels = {
    "ACTIVE": "Actif",
    "ACTIF": "Actif",
    "RESILIE": "Résilié",
    "RÉSILIE": "Résilié",
    "EN_COURS": "En cours",
    "EN COURS": "En cours",
    "TERMINEE": "Terminée",
    "TERMINÉE": "Terminée",
    "REMBOURSEE": "Remboursée",
    "REMBOURSÉE": "Remboursée",
    "ANNULEE": "Annulée",
    "ANNULÉE": "Annulée",
    "REFUSEE": "Refusée",
    "REFUSÉE": "Refusée",
  };

  const label = labels[s] || s;

  let config = { bg: COLORS.textSecondary, color: COLORS.textSecondary };

  if (["ACTIVE", "ACTIF", "TERMINÉE", "TERMINEE", "VALIDÉE", "VALIDEE", "DECLAREE", "REMBOURSEE", "REMBOURSÉE"].includes(s)) {
    config = { bg: COLORS.success, color: COLORS.success };
  } else if (["EN_COURS", "EN_ATTENTE", "EN COURS"].includes(s)) {
    config = { bg: COLORS.warning, color: COLORS.warning };
  } else if (["RESILIE", "RÉSILIE", "REFUSÉE", "REFUSEE", "ANNULEE", "ANNULÉE", "INACTIF"].includes(s)) {
    config = { bg: COLORS.error, color: COLORS.error };
  }

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 1.5,
        py: 0.5,
        borderRadius: '8px',
        bgcolor: `${config.bg}20`,
        color: config.color,
        fontWeight: 600,
        fontSize: '0.75rem',
        border: `1px solid ${config.bg}30`
      }}
    >
      {label}
    </Box>
  );
};

const TableSection = ({ title, icon: Icon, columns, data, emptyMessage, statusIndex }) => (
  <Card
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '20px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      border: '1px solid rgba(0,0,0,0.05)',
    }}
  >
    <Box sx={{ p: 3, borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center' }}>
      <Box sx={{ bgcolor: `${COLORS.primary}15`, p: 1.5, borderRadius: '12px', mr: 2, color: COLORS.primary }}>
        <Icon size={20} />
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: COLORS.textPrimary }}>{title}</Typography>
    </Box>
    <TableContainer sx={{ flexGrow: 1 }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((col, idx) => (
              <TableCell key={idx} sx={{ bgcolor: COLORS.hoverBg }}>{col}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                <Typography variant="subtitle2">{emptyMessage}</Typography>
              </TableCell>
            </TableRow>
          ) : (
            data.map((row, rIdx) => (
              <TableRow
                key={rIdx}
                hover
                sx={{
                  '&:hover': { bgcolor: COLORS.hoverBg },
                  cursor: 'default',
                  transition: 'background-color 0.2s'
                }}
              >
                {row.map((cell, cIdx) => (
                  <TableCell key={cIdx}>
                    {statusIndex === cIdx ? <StatusBadge status={cell} /> : (
                      <Typography variant="body2" sx={{
                        fontWeight: cIdx === 0 ? 600 : 400,
                        color: cIdx === 0 ? COLORS.textPrimary : COLORS.textSecondary,
                        fontSize: '0.875rem'
                      }}>
                        {cell}
                      </Typography>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  </Card>
);

const ChartSection = ({ distribution, operations }) => {
  const monthNames = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aout", "Sep", "Oct", "Nov", "Dec"];
  const groupedByMonth = new Map();

  (Array.isArray(operations) ? operations : []).forEach((row) => {
    const rawDate = row?.date_operation || row?.date;
    if (!rawDate) return;

    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) return;

    const year = parsedDate.getFullYear();
    const month = parsedDate.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;
    groupedByMonth.set(key, (groupedByMonth.get(key) || 0) + 1);
  });

  const sortedEntries = [...groupedByMonth.entries()].sort(([a], [b]) => a.localeCompare(b));
  const operationTrend = {
    labels: sortedEntries.map(([key]) => {
      const [year, month] = key.split("-");
      return `${monthNames[Number(month) - 1]} ${year}`;
    }),
    values: sortedEntries.map(([, value]) => value),
  };

  const pieData = [
    { id: 0, label: "En cours", value: Number(distribution?.EN_COURS || 0), color: COLORS.warning },
    { id: 1, label: "Terminée", value: Number(distribution?.TERMINEE || 0), color: COLORS.success },
    { id: 2, label: "Annulée", value: Number(distribution?.ANNULEE || 0), color: COLORS.error },
  ].filter((item) => item.value > 0);

  return (
    <Grid container spacing={3}>
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
              <Box sx={{ backgroundColor: `${COLORS.primary}15`, borderRadius: "12px", p: 1.5, mr: 2 }}>
                <TrendingUp size={20} color={COLORS.primary} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: COLORS.textPrimary }}>
                Evolution des Opérations
              </Typography>
            </Box>

            {operationTrend.labels.length > 0 ? (
              <Box sx={{ height: 300, width: "100%" }}>
                <BarChart
                  xAxis={[
                    {
                      scaleType: "band",
                      data: operationTrend.labels,
                      tickLabelStyle: { fontSize: 12, fill: COLORS.textSecondary },
                    },
                  ]}
                  series={[
                    {
                      data: operationTrend.values,
                      color: COLORS.primary,
                      label: "Nombre d'opérations",
                    },
                  ]}
                  height={280}
                  margin={{ left: 70, right: 20, top: 20, bottom: 40 }}
                  sx={{
                    "& .MuiChartsAxis-line": { stroke: "#e2e8f0" },
                    "& .MuiChartsAxis-tick": { stroke: "#e2e8f0" },
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
                <Typography sx={{ color: COLORS.textSecondary }}>Aucune donnée disponible</Typography>
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
              <Box sx={{ backgroundColor: `${COLORS.info}15`, borderRadius: "12px", p: 1.5, mr: 2 }}>
                <CheckCircle size={20} color={COLORS.info} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: "1.1rem", color: COLORS.textPrimary }}>
                Statuts Opérations
              </Typography>
            </Box>

            {pieData.length > 0 ? (
              <Box sx={{ height: 280, display: "flex", justifyContent: "center" }}>
                <PieChart
                  series={[
                    {
                      data: pieData,
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
                        fill: COLORS.textSecondary,
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
                <Typography sx={{ color: COLORS.textSecondary }}>Aucune donnée disponible</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

// --- Main Layout ---

function MutuelleDashboard() {
  const [data, setData] = useState(EMPTY_MUTUELLE_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { setTitle, searchQuery } = useHeader();
  const { dynamicStyles } = useOpen();
  const normalizedSearch = (searchQuery || "").toLowerCase().trim();

  // Responsive handling
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'lg'));

  useEffect(() => {
    setTitle("Tableau de Bord Assurances");
  }, [setTitle]);

  useEffect(() => {
    const fetchStats = async () => {
      // Tentative de récupération depuis le cache pour un chargement instantané
      const cachedData = sessionStorage.getItem('mutuelle_dashboard_cache');
      const cacheTimestamp = sessionStorage.getItem('mutuelle_dashboard_timestamp');
      const now = Date.now();
      let hasCachedData = false;

      if (cachedData) {
        try {
          setData(JSON.parse(cachedData));
          setLoading(false);
          hasCachedData = true;
        } catch (cacheError) {
          console.warn("Cache Mutuelle invalide:", cacheError);
        }
      }

      if (cachedData && cacheTimestamp && (now - Number.parseInt(cacheTimestamp, 10)) < 120000) { // 2 minutes de cache
        return;
      }

      if (!hasCachedData) {
        setLoading(true);
      }
      setError(null);
      try {
        const resp = await api.get("/mutuelle/dashboard-stats");
        setData(resp.data);
        // Mise en cache des résultats
        sessionStorage.setItem('mutuelle_dashboard_cache', JSON.stringify(resp.data));
        sessionStorage.setItem('mutuelle_dashboard_timestamp', now.toString());
      } catch (e) {
        console.error("Dashboard Error:", e);
        setError("Impossible de charger les données.");
        setData(EMPTY_MUTUELLE_DASHBOARD);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Format Helpers
  const formatDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("fr-FR", { year: 'numeric', month: 'numeric', day: 'numeric' });
  };

  // Data Preparation
  const kpis = data?.kpis || { affiliations_actives: 0, affiliations_inactives: 0, dossiers_en_cours: 0, dossiers_termines: 0 };

  // Calculate specific counters if missing in KPI object but present in lists
  const rawAffList = data?.latest_affiliations || data?.recentAffiliations || [];
  const filteredAffiliations = useMemo(() => {
    if (!normalizedSearch) return rawAffList;
    return rawAffList.filter((a) => {
      const values = [
        a.employe?.nom,
        a.employe?.prenom,
        a.employe?.matricule,
        a.statut,
        a.date_adhesion || a.date_affiliation,
      ];
      return values.some((v) => v && v.toString().toLowerCase().includes(normalizedSearch));
    });
  }, [rawAffList, normalizedSearch]);

  const computedActive = data?.kpis?.affiliations_actives ?? rawAffList.filter(a => (a.statut || "").trim() === "ACTIVE").length;
  const computedInactive = data?.kpis?.affiliations_inactives ?? rawAffList.filter(a => (a.statut || "").trim() === "RESILIE").length;

  const displayKpis = {
    active: kpis.affiliations_actives || computedActive || 0,
    inactive: kpis.affiliations_inactives || computedInactive || 0,
    pending: kpis.dossiers_en_cours || 0,
    completed: kpis.dossiers_termines || 0
  };

  const affRows = filteredAffiliations.slice(0, 5).map(a => [
    `${a.employe?.nom || ""} ${a.employe?.prenom || ""}`,
    a.employe?.matricule || "-",
    formatDate(a.date_adhesion || a.date_affiliation),
    a.statut || "-"
  ]);

  const filteredDossiers = useMemo(() => {
    const list = data?.latest_dossiers || data?.recentDossiers || [];
    if (!normalizedSearch) return list;
    return list.filter((d) => {
      const values = [
        d.type_operation || d.type,
        d.statut,
        d.date_operation || d.date,
        `${d.employe?.nom || ""} ${d.employe?.prenom || ""}`,
      ];
      return values.some((v) => v && v.toString().toLowerCase().includes(normalizedSearch));
    });
  }, [data, normalizedSearch]);

  const dosRows = filteredDossiers.slice(0, 5).map(d => [
    formatDate(d.date_operation || d.date),
    d.type_operation || d.type || "-",
    `${d.employe?.nom || ""} ${d.employe?.prenom || ""}`,
    d.statut || "-"
  ]);

  const distribution = data?.distribution || data?.statusBreakdown || { EN_COURS: 0, TERMINEE: 0, ANNULEE: 0, total: 0 };
  // Ensure total exists
  if (!distribution.total) {
    distribution.total = (distribution.EN_COURS || 0) + (distribution.TERMINEE || 0) + (distribution.ANNULEE || 0);
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        ...dynamicStyles,
        mt: '80px',
        bgcolor: COLORS.bg,
        height: 'calc(100vh - 80px)',
        overflowY: 'auto',
        p: { xs: 2, md: 4 },
        transition: 'margin-left 0.3s ease'
      }}>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontWeight: 800, color: COLORS.textPrimary, fontSize: '1.75rem', mb: 0.5 }}>
            Tableau de bord Assurances
          </Typography>
          <Typography sx={{ color: COLORS.textSecondary, fontSize: '0.95rem' }}>
            Aperçu global des affiliations et des opérations
          </Typography>
        </Box>

        {loading ? <LinearProgress sx={{ mb: 3, borderRadius: 2 }} /> : null}

        {/* KPIs Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Affiliations Actives"
              value={displayKpis.active}
              icon={Users}
                subtitle="Affiliations en cours"
                bgGradient="linear-gradient(135deg, #2c767c 0%, #4db6ac 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Affiliations Résiliées"
              value={displayKpis.inactive}
              icon={XCircle}
                subtitle="Affiliations clôturées"
                bgGradient="linear-gradient(135deg, #f97316 0%, #ef4444 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Opérations En Cours"
              value={displayKpis.pending}
              icon={Clock}
                subtitle="Traitement en cours"
                bgGradient="linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <StatCard
              title="Opérations Traitées"
              value={displayKpis.completed}
              icon={CheckCircle}
                subtitle="Dossiers finalisés"
                bgGradient="linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)"
            />
          </Grid>
        </Grid>

        {/* Distribution Chart */}
        <Box sx={{ mb: 4 }}>
          <ChartSection distribution={distribution} operations={filteredDossiers} />
        </Box>

        {/* Tables Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} xl={6}>
            <TableSection
              title="Dernières Affiliations"
              icon={Users}
              columns={["Employé", "Matricule", "Date", "Statut"]}
              data={affRows}
              emptyMessage="Aucune affiliation récente"
              statusIndex={3}
            />
          </Grid>
          <Grid item xs={12} xl={6}>
            <TableSection
              title="Dernières Opérations"
              icon={FileText}
              columns={["Date", "Type", "Employé", "Statut"]}
              data={dosRows}
              emptyMessage="Aucune opération récente"
              statusIndex={3}
            />
          </Grid>
        </Grid>

      </Box>
    </ThemeProvider>
  );
}

export default MutuelleDashboard;



