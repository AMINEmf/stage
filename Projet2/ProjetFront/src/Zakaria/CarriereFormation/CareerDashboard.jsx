import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  ThemeProvider,
  Typography,
  createTheme,
  Toolbar,
} from "@mui/material";
import { BarChart, PieChart } from "@mui/x-charts";
import {
  Users,
  TrendingUp,
  Briefcase,
  Award,
  BarChart3,
  Target,
} from "lucide-react";
import { useHeader } from "../../Acceuil/HeaderContext";
import { useOpen } from "../../Acceuil/OpenProvider";
import apiClient from "../../services/apiClient";

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
  divider: "rgba(44, 118, 124, 0.2)",
};

const CACHE_TTL = 5 * 60 * 1000;
const CAREER_DASHBOARD_CACHE_KEY = "dashboard-carrieres-cache-v2";

const DEFAULT_CAREER_DASHBOARD = {
  kpis: {
    total_employes: 0,
    promotions: 0,
    postes_occupes: 0,
    grades_distincts: 0,
    mobilites_total: 0,
    mobilites_acceptees: 0,
    mobilites_refusees: 0,
  },
  charts: {
    month_labels: [],
    month_data: [],
    grades: [],
    evolution_types: [],
  },
};

const normalizeCareerDashboard = (payload) => {
  const source = payload && typeof payload === "object" ? payload : {};
  const kpis = source.kpis && typeof source.kpis === "object" ? source.kpis : {};
  const charts = source.charts && typeof source.charts === "object" ? source.charts : {};

  return {
    kpis: {
      ...DEFAULT_CAREER_DASHBOARD.kpis,
      ...kpis,
    },
    charts: {
      ...DEFAULT_CAREER_DASHBOARD.charts,
      ...charts,
      month_labels: Array.isArray(charts.month_labels) ? charts.month_labels : [],
      month_data: Array.isArray(charts.month_data) ? charts.month_data : [],
      grades: Array.isArray(charts.grades) ? charts.grades : [],
      evolution_types: Array.isArray(charts.evolution_types) ? charts.evolution_types : [],
    },
  };
};

const CareerDashboard = () => {
  const { setTitle, clearActions } = useHeader();
  const { dynamicStyles } = useOpen();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(DEFAULT_CAREER_DASHBOARD);

  useEffect(() => {
    setTitle("Tableau de bord Carrières");
    return () => {
      clearActions();
    };
  }, [setTitle, clearActions]);

  useEffect(() => {
    const fetchData = async () => {
      let hasCachedData = false;

      try {
        const cachedRaw = localStorage.getItem(CAREER_DASHBOARD_CACHE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          const isFresh = cached?.timestamp && Date.now() - Number(cached.timestamp) < CACHE_TTL;
          if (isFresh && cached?.data) {
            setDashboardData(normalizeCareerDashboard(cached.data));
            setLoading(false);
            hasCachedData = true;
          }
        }
      } catch (e) {
        console.warn("Cache dashboard carrières invalide:", e);
      }

      try {
        const response = await apiClient.get("/dashboard/carrieres");
        const normalized = normalizeCareerDashboard(response?.data);
        setDashboardData(normalized);

        try {
          localStorage.setItem(
            CAREER_DASHBOARD_CACHE_KEY,
            JSON.stringify({
              data: normalized,
              timestamp: Date.now(),
            })
          );
        } catch (e) {
          console.warn("Erreur sauvegarde cache dashboard carrières:", e);
        }
      } catch (error) {
        console.error("Erreur lors du chargement du dashboard carrières:", error);
        if (!hasCachedData) {
          setDashboardData(DEFAULT_CAREER_DASHBOARD);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
      <CardContent sx={{ p: "1.5rem", position: "relative", zIndex: 1 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <Box>
            <Typography
              sx={{
                color: "rgba(255,255,255,0.85)",
                mb: "0.5rem",
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
              <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8rem" }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
          <Box
            sx={{
              backgroundColor: "rgba(255,255,255,0.2)",
              borderRadius: "16px",
              p: "0.85rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              backdropFilter: "blur(10px)",
            }}
          >
            <Icon size={26} color="#fff" />
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

  const kpis = [
    {
      title: "Total Employés avec Carrière",
      value: dashboardData.kpis.total_employes,
      icon: Users,
      subtitle: "Population suivie",
      bgGradient: "linear-gradient(135deg, #2c767c 0%, #4db6ac 100%)",
    },
    {
      title: "Promotions Réalisées",
      value: dashboardData.kpis.promotions,
      icon: TrendingUp,
      subtitle: "Progressions validées",
      bgGradient: "linear-gradient(135deg, #26a69a 0%, #00897b 100%)",
    },
    {
      title: "Postes Occupés",
      value: dashboardData.kpis.postes_occupes,
      icon: Briefcase,
      subtitle: "Postes actifs",
      bgGradient: "linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)",
    },
    {
      title: "Grades Distincts",
      value: dashboardData.kpis.grades_distincts,
      icon: Award,
      subtitle: "Niveaux recensés",
      bgGradient: "linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)",
    },
    {
      title: "Mobilités Internes",
      value: dashboardData.kpis.mobilites_total,
      icon: BarChart3,
      subtitle: "Changements de poste",
      bgGradient: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
    },
    {
      title: "Mobilités Acceptées",
      value: dashboardData.kpis.mobilites_acceptees,
      icon: Target,
      subtitle: "Décisions favorables",
      bgGradient: "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
    },
  ];

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
          pb: { xs: "3rem", sm: "4rem", md: "5rem" },
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
            Tableau de bord Carrières
          </Typography>
          <Typography sx={{ color: themeColors.textSecondary, fontSize: "0.95rem" }}>
            Suivi des promotions, grades et évolutions de carrière
          </Typography>
        </Box>

        {/* KPI Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {kpis.map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item.title}>
              <StatCard
                title={item.title}
                value={item.value}
                subtitle={item.subtitle}
                icon={item.icon}
                bgGradient={item.bgGradient}
              />
            </Grid>
          ))}
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Promotions par mois */}
          <Grid item xs={12} md={7}>
            <Card
              sx={{
                borderRadius: "20px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <CardContent sx={{ p: "1.5rem" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: "1.5rem",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: `${themeColors.teal}15`,
                      borderRadius: "12px",
                      p: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <BarChart3 size={20} color={themeColors.teal} />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      color: themeColors.textPrimary,
                    }}
                  >
                    Promotions par Mois
                  </Typography>
                </Box>
                {loading ? (
                  <Box sx={{ textAlign: "center", py: 8, color: themeColors.textSecondary }}>
                    Chargement...
                  </Box>
                ) : dashboardData.charts.month_data.length > 0 ? (
                  <Box sx={{ width: "100%", height: 300 }}>
                    <BarChart
                      height={300}
                      xAxis={[{ data: dashboardData.charts.month_labels, scaleType: "band" }]}
                      series={[{ data: dashboardData.charts.month_data, color: themeColors.teal }]}
                      margin={{ left: 40, right: 20, top: 20, bottom: 40 }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ textAlign: "center", py: 8, color: themeColors.textSecondary }}>
                    Aucune donnée disponible
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Répartition par grade */}
          <Grid item xs={12} md={5}>
            <Card
              sx={{
                borderRadius: "20px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <CardContent sx={{ p: "1.5rem" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: "1.5rem",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: `${themeColors.secondary}15`,
                      borderRadius: "12px",
                      p: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Award size={20} color={themeColors.secondary} />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      color: themeColors.textPrimary,
                    }}
                  >
                    Répartition des Grades
                  </Typography>
                </Box>
                {loading ? (
                  <Box sx={{ textAlign: "center", py: 8, color: themeColors.textSecondary }}>
                    Chargement...
                  </Box>
                ) : dashboardData.charts.grades.length > 0 ? (
                  <Box sx={{ width: "100%", height: 300 }}>
                    <PieChart
                      height={300}
                      series={[
                        {
                          data: dashboardData.charts.grades,
                          innerRadius: 50,
                          outerRadius: 120,
                          paddingAngle: 2,
                        },
                      ]}
                      margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ textAlign: "center", py: 8, color: themeColors.textSecondary }}>
                    Aucune donnée disponible
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Types d'évolution */}
          <Grid item xs={12}>
            <Card
              sx={{
                borderRadius: "20px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <CardContent sx={{ p: "1.5rem" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: "1.5rem",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                  }}
                >
                  <Box
                    sx={{
                      backgroundColor: `${themeColors.info}15`,
                      borderRadius: "12px",
                      p: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Target size={20} color={themeColors.info} />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      color: themeColors.textPrimary,
                    }}
                  >
                    Types d'Évolution
                  </Typography>
                </Box>
                {loading ? (
                  <Box sx={{ textAlign: "center", py: 8, color: themeColors.textSecondary }}>
                    Chargement...
                  </Box>
                ) : dashboardData.charts.evolution_types.length > 0 ? (
                  <Box sx={{ width: "100%", height: 300 }}>
                    <BarChart
                      height={300}
                      xAxis={[
                        {
                          data: dashboardData.charts.evolution_types.map((t) => t.label),
                          scaleType: "band",
                        },
                      ]}
                      series={[
                        {
                          data: dashboardData.charts.evolution_types.map((t) => t.value),
                          color: themeColors.secondary,
                        },
                      ]}
                      margin={{ left: 40, right: 20, top: 20, bottom: 60 }}
                    />
                  </Box>
                ) : (
                  <Box sx={{ textAlign: "center", py: 8, color: themeColors.textSecondary }}>
                    Aucune donnée disponible
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </ThemeProvider>
  );
};

export default CareerDashboard;
