import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AssessmentIcon from "@mui/icons-material/Assessment";
import BusinessIcon from "@mui/icons-material/Business";
import GavelIcon from "@mui/icons-material/Gavel";
import HealthAndSafetyIcon from "@mui/icons-material/HealthAndSafety";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import SecurityIcon from "@mui/icons-material/Security";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SchoolIcon from "@mui/icons-material/School";
import { Link as RouterLink } from "react-router-dom";
import apiClient from "../services/apiClient";
import { useOpen } from "./OpenProvider";
import { useHeader } from "./HeaderContext";

const theme = createTheme();
const HOME_DASHBOARD_CACHE_KEY = "HOME_DASHBOARD_CACHE_V4";
const NAV_PERMISSIONS_CACHE_KEY = "NAV_PERMISSIONS_CACHE";
const DASHBOARD_CACHE_TTL_MS = 2 * 60 * 1000;

const DASHBOARD_COLORS = {
  teal: "#2c767c",
  tealLight: "#4db6ac",
  blue: "#0284c7",
  indigo: "#0369a1",
  cardShadow: "0 8px 32px rgba(0,0,0,0.12)",
  cardShadowHover: "0 16px 48px rgba(0,0,0,0.18)",
  pageBg: "#ffffff",
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
};

const EMPLOYEE_MENU_PERMISSIONS = [
  "view_all_employes",
  "create_employes",
  "update_employes",
  "delete_employes",
  "view_all_employee_histories",
];

const SOCIETE_MENU_PERMISSIONS = [
  "view_all_societes",
  "create_societes",
  "update_societes",
  "delete_societes",
];

const INITIAL_SUMMARY = {
  totalEmployees: 0,
  femmes: 0,
  hommes: 0,
  departements: 0,
};

const INITIAL_MODULE_STATS = {
  accidents: null,
  carrieres: null,
  cimr: null,
  cnss: null,
  conflits: null,
  formations: null,
  mutuelle: null,
  sanctions: null,
  societes: null,
  users: null,
};

const resolveScopedCacheKey = (baseKey) => {
  const token = globalThis.localStorage?.getItem("API_TOKEN");
  if (!token) return `${baseKey}_anon`;
  return `${baseKey}_${token.slice(-16)}`;
};

const readJsonCache = (key, fallback) => {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const writeJsonCache = (key, value) => {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore cache write errors (quota/private mode)
  }
};

const normalizeUserPayload = (rawUser) => {
  if (!rawUser) return null;
  const normalized = Array.isArray(rawUser) ? rawUser : [rawUser];
  return normalized.length > 0 ? normalized : null;
};

const extractPermissionNames = (normalizedUser) => {
  const currentUser = normalizedUser?.[0] ?? {};
  const roles = Array.isArray(currentUser.roles) ? currentUser.roles : [];

  const rolePermissionNames = roles
    .flatMap((role) => (Array.isArray(role?.permissions) ? role.permissions : []))
    .map((permission) => permission?.name)
    .filter(Boolean);

  const directPermissionNames = (Array.isArray(currentUser.permissions) ? currentUser.permissions : [])
    .map((permission) => (typeof permission === "string" ? permission : permission?.name))
    .filter(Boolean);

  return [...new Set([...rolePermissionNames, ...directPermissionNames])];
};

const toSafeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const toCollectionCount = (payload) => {
  if (Array.isArray(payload)) return payload.length;
  if (Array.isArray(payload?.data)) return payload.data.length;
  if (Array.isArray(payload?.items)) return payload.items.length;
  if (typeof payload?.total === "number") return payload.total;
  if (typeof payload?.count === "number") return payload.count;
  return 0;
};

const countCurrentMonthItems = (list, dateField) => {
  if (!Array.isArray(list)) return 0;

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  return list.filter((item) => {
    const raw = item?.[dateField];
    if (!raw) return false;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return false;
    return parsed.getMonth() === month && parsed.getFullYear() === year;
  }).length;
};

const formatMetricValue = (value, format) => {
  const numericValue = toSafeNumber(value);
  if (format === "currency") {
    return `${numericValue.toLocaleString("fr-FR")} DH`;
  }
  if (format === "percent") {
    return `${numericValue}%`;
  }
  return numericValue.toLocaleString("fr-FR");
};

const TopStatCard = ({ title, value, icon: Icon, bgGradient }) => (
  <Card
    sx={{
      background: bgGradient,
      borderRadius: "20px",
      boxShadow: DASHBOARD_COLORS.cardShadow,
      position: "relative",
      overflow: "hidden",
      minHeight: 132,
      transition: "all 0.3s ease",
      cursor: "pointer",
      "&:hover": {
        transform: "translateY(-5px)",
        boxShadow: DASHBOARD_COLORS.cardShadowHover,
      },
    }}
  >
    <CardContent sx={{ p: 2.5, position: "relative", zIndex: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box>
          <Typography
            sx={{
              color: "rgba(255,255,255,0.85)",
              fontWeight: 500,
              fontSize: "0.82rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              mb: 0.8,
            }}
          >
            {title}
          </Typography>
          <Typography sx={{ color: "#ffffff", fontWeight: 700, fontSize: "2.1rem", lineHeight: 1.1 }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: "rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(10px)",
          }}
        >
          <Icon sx={{ color: "#ffffff", fontSize: 28 }} />
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

const InterfaceCard = ({ title, description, icon: Icon, color, route, metrics, loading, error }) => (
  <Card
    sx={{
      height: "100%",
      borderRadius: "20px",
      border: `1px solid ${color}25`,
      boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
      display: "flex",
      flexDirection: "column",
      transition: "all 0.3s ease",
      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
      },
    }}
  >
    <CardContent sx={{ flex: 1, p: 2.5 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            bgcolor: `${color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon sx={{ color, fontSize: 22 }} />
        </Box>
        <Typography sx={{ fontWeight: 700, color: "#0f172a", fontSize: "1rem" }}>{title}</Typography>
      </Stack>

      <Typography sx={{ color: DASHBOARD_COLORS.textSecondary, fontSize: "0.86rem", mb: 2 }}>{description}</Typography>

      <Stack spacing={1}>
        {metrics.map((metric) => (
          <Stack key={metric.label} direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ color: DASHBOARD_COLORS.textSecondary, fontSize: "0.84rem" }}>{metric.label}</Typography>
            <Typography sx={{ color: DASHBOARD_COLORS.textPrimary, fontWeight: 700, fontSize: "0.9rem" }}>
              {formatMetricValue(metric.value, metric.format)}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </CardContent>

    <Divider />

    <CardActions sx={{ px: 2.5, py: 1.4, justifyContent: "space-between" }}>
      {loading ? (
        <Chip size="small" label="Chargement" sx={{ bgcolor: "#eef2ff", color: "#334155" }} />
      ) : error ? (
        <Chip size="small" label="Donnees indisponibles" sx={{ bgcolor: "#fff1f2", color: "#be123c" }} />
      ) : (
        <Chip size="small" label="Donnees synchronisees" sx={{ bgcolor: "#ecfdf5", color: "#065f46" }} />
      )}

      <Button
        size="small"
        component={RouterLink}
        to={route}
        endIcon={<ArrowForwardIcon fontSize="small" />}
        sx={{ textTransform: "none", fontWeight: 700 }}
      >
        Ouvrir
      </Button>
    </CardActions>
  </Card>
);

const Dashboard = () => {
  const { dynamicStyles } = useOpen();
  const { setTitle, clearActions } = useHeader();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const [moduleStats, setModuleStats] = useState(INITIAL_MODULE_STATS);
  const [moduleErrors, setModuleErrors] = useState({});

  useEffect(() => {
    setTitle("Accueil");
    clearActions();
    return () => {
      clearActions();
    };
  }, [setTitle, clearActions]);

  useEffect(() => {
    let isMounted = true;

    const resolvePermissions = async () => {
      const scopedPermissionsKey = resolveScopedCacheKey(NAV_PERMISSIONS_CACHE_KEY);
      const cachedScoped = readJsonCache(scopedPermissionsKey, []);
      const cachedLegacy = readJsonCache(NAV_PERMISSIONS_CACHE_KEY, []);

      const mergedCached = [
        ...(Array.isArray(cachedScoped) ? cachedScoped : []),
        ...(Array.isArray(cachedLegacy) ? cachedLegacy : []),
      ];

      const dedupedCached = [...new Set(mergedCached.filter(Boolean))];
      if (dedupedCached.length > 0) {
        return dedupedCached;
      }

      try {
        const response = await apiClient.get("/user", {
          withCredentials: true,
          timeout: 15000,
        });
        const normalizedUser = normalizeUserPayload(response?.data?.user ?? response?.data);
        const permissionNames = extractPermissionNames(normalizedUser);

        if (permissionNames.length > 0) {
          writeJsonCache(scopedPermissionsKey, permissionNames);
          writeJsonCache(NAV_PERMISSIONS_CACHE_KEY, permissionNames);
        }

        return permissionNames;
      } catch {
        return [];
      }
    };

    const fetchDashboardData = async () => {
      const scopedDashboardCacheKey = resolveScopedCacheKey(HOME_DASHBOARD_CACHE_KEY);
      const cachedSnapshot = readJsonCache(scopedDashboardCacheKey, null);

      let hasCachedSnapshot = false;
      if (cachedSnapshot && typeof cachedSnapshot === "object") {
        const cachedSummary = cachedSnapshot.summary && typeof cachedSnapshot.summary === "object"
          ? { ...INITIAL_SUMMARY, ...cachedSnapshot.summary }
          : INITIAL_SUMMARY;

        const cachedModules = cachedSnapshot.moduleStats && typeof cachedSnapshot.moduleStats === "object"
          ? { ...INITIAL_MODULE_STATS, ...cachedSnapshot.moduleStats }
          : INITIAL_MODULE_STATS;

        if (isMounted) {
          setPermissions(Array.isArray(cachedSnapshot.permissions) ? cachedSnapshot.permissions : []);
          setSummary(cachedSummary);
          setModuleStats(cachedModules);
          setModuleErrors(cachedSnapshot.moduleErrors && typeof cachedSnapshot.moduleErrors === "object" ? cachedSnapshot.moduleErrors : {});
          setLoading(false);
        }

        hasCachedSnapshot = true;
        const isFresh = cachedSnapshot.timestamp && Date.now() - Number(cachedSnapshot.timestamp) < DASHBOARD_CACHE_TTL_MS;
        if (isFresh) {
          return;
        }
      }

      if (!hasCachedSnapshot && isMounted) {
        setLoading(true);
      }
      if (isMounted) {
        setError("");
      }

      const resolvedPermissions = await resolvePermissions();
      if (!isMounted) return;

      setPermissions(resolvedPermissions);

      const canAccessEmployeesMenu = resolvedPermissions.some((permission) => EMPLOYEE_MENU_PERMISSIONS.includes(permission));
      const canAccessSocieteMenu = resolvedPermissions.some((permission) => SOCIETE_MENU_PERMISSIONS.includes(permission));

      const [employeeStatsResult, departementStatsResult] = await Promise.allSettled([
        apiClient.get("/employes/dashboard-stats", { timeout: 30000 }),
        apiClient.get("/total-departemet", { timeout: 30000 }),
      ]);

      const nextSummary = {
        totalEmployees: employeeStatsResult.status === "fulfilled"
          ? toSafeNumber(employeeStatsResult.value?.data?.totalEmployees)
          : 0,
        femmes: employeeStatsResult.status === "fulfilled"
          ? toSafeNumber(employeeStatsResult.value?.data?.femmes)
          : 0,
        hommes: employeeStatsResult.status === "fulfilled"
          ? toSafeNumber(employeeStatsResult.value?.data?.hommes)
          : 0,
        departements: departementStatsResult.status === "fulfilled"
          ? toSafeNumber(departementStatsResult.value?.data?.totalDepartements)
          : 0,
      };

      const requestDefs = [];

      if (resolvedPermissions.includes("view_all_accidents")) {
        requestDefs.push({ key: "accidents", request: apiClient.get("/accidents", { timeout: 30000 }) });
      }
      if (resolvedPermissions.includes("view_all_cimr")) {
        requestDefs.push({ key: "cimr", request: apiClient.get("/cimr-declarations/dashboard-stats", { timeout: 30000 }) });
      }
      if (resolvedPermissions.includes("view_all_mutuelle")) {
        requestDefs.push({ key: "mutuelle", request: apiClient.get("/mutuelle/dashboard-stats", { timeout: 30000 }) });
      }
      if (resolvedPermissions.includes("view_all_cnss")) {
        const today = new Date();
        requestDefs.push({
          key: "cnss",
          request: apiClient.get("/cnss/dashboard", {
            params: { mois: today.getMonth() + 1, annee: today.getFullYear() },
            timeout: 30000,
          }),
        });
      }
      if (resolvedPermissions.includes("view_all_carrieres_formations")) {
        requestDefs.push({ key: "carrieres", request: apiClient.get("/dashboard/carrieres", { timeout: 30000 }) });
        requestDefs.push({ key: "formations", request: apiClient.get("/dashboard/formations", { timeout: 30000 }) });
      }
      if (resolvedPermissions.includes("view_all_conflits")) {
        requestDefs.push({ key: "conflits", request: apiClient.get("/conflits", { timeout: 30000 }) });
      }
      if (resolvedPermissions.includes("view_all_sanctions")) {
        requestDefs.push({ key: "sanctions", request: apiClient.get("/sanctions", { timeout: 30000 }) });
      }
      if (canAccessSocieteMenu) {
        requestDefs.push({ key: "societes", request: apiClient.get("/societes", { timeout: 30000 }) });
      }
      if (resolvedPermissions.includes("view_all_users")) {
        requestDefs.push({ key: "users", request: apiClient.get("/users", { timeout: 30000 }) });
      }

      const moduleResults = await Promise.allSettled(requestDefs.map((definition) => definition.request));

      const nextModuleStats = { ...INITIAL_MODULE_STATS };
      const nextModuleErrors = {};

      moduleResults.forEach((result, index) => {
        const key = requestDefs[index]?.key;
        if (!key) return;

        if (result.status === "rejected") {
          nextModuleErrors[key] = "Erreur de recuperation";
          return;
        }

        const payload = result.value?.data;

        if (key === "accidents") {
          nextModuleStats.accidents = { total: toCollectionCount(payload) };
          return;
        }
        if (key === "cimr") {
          nextModuleStats.cimr = {
            totalAffiliations: toSafeNumber(payload?.totalAffiliations),
            declarationsThisMonth: toSafeNumber(payload?.declarationsThisMonth),
            totalAmountThisMonth: toSafeNumber(payload?.totalAmountThisMonth),
          };
          return;
        }
        if (key === "mutuelle") {
          const kpis = payload?.kpis ?? {};
          nextModuleStats.mutuelle = {
            affiliationsActives: toSafeNumber(kpis.affiliations_actives),
            affiliationsInactives: toSafeNumber(kpis.affiliations_inactives),
            dossiersEnCours: toSafeNumber(kpis.dossiers_en_cours),
            dossiersTermines: toSafeNumber(kpis.dossiers_termines),
          };
          return;
        }
        if (key === "cnss") {
          const kpis = payload?.kpis ?? {};
          nextModuleStats.cnss = {
            affiliationsActif: toSafeNumber(kpis.affiliations_actif),
            declarationsEnAttente: toSafeNumber(kpis.declarations_en_attente),
            masseSalariale: toSafeNumber(kpis.masse_salariale),
            montantCnss: toSafeNumber(kpis.montant_cnss),
          };
          return;
        }
        if (key === "carrieres") {
          const kpis = payload?.kpis ?? {};
          nextModuleStats.carrieres = {
            totalEmployes: toSafeNumber(kpis.total_employes),
            promotions: toSafeNumber(kpis.promotions),
            postesOccupes: toSafeNumber(kpis.postes_occupes),
          };
          return;
        }
        if (key === "formations") {
          const kpis = payload?.kpis ?? {};
          nextModuleStats.formations = {
            formationsActives: toSafeNumber(kpis.formations_actives),
            participantsTotal: toSafeNumber(kpis.participants_total),
            tauxReussite: toSafeNumber(kpis.taux_reussite),
          };
          return;
        }
        if (key === "conflits") {
          const conflitsList = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

          nextModuleStats.conflits = {
            total: Array.isArray(conflitsList) && conflitsList.length > 0
              ? conflitsList.length
              : toSafeNumber(payload?.totalConflits),
            thisMonth: Array.isArray(conflitsList) && conflitsList.length > 0
              ? countCurrentMonthItems(conflitsList, "date_incident")
              : toSafeNumber(payload?.conflitsThisMonth),
          };
          return;
        }
        if (key === "sanctions") {
          const sanctionsList = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
              ? payload.data
              : [];

          nextModuleStats.sanctions = {
            total: Array.isArray(sanctionsList) && sanctionsList.length > 0
              ? sanctionsList.length
              : toSafeNumber(payload?.total),
            thisMonth: Array.isArray(sanctionsList) && sanctionsList.length > 0
              ? countCurrentMonthItems(sanctionsList, "date_sanction")
              : toSafeNumber(payload?.this_month),
          };
          return;
        }
        if (key === "societes") {
          nextModuleStats.societes = { total: toCollectionCount(payload) };
          return;
        }
        if (key === "users") {
          nextModuleStats.users = { total: toCollectionCount(payload) };
        }
      });

      if (!isMounted) return;

      setSummary(nextSummary);
      setModuleStats(nextModuleStats);
      setModuleErrors(nextModuleErrors);

      if (
        employeeStatsResult.status === "rejected" &&
        departementStatsResult.status === "rejected" &&
        Object.keys(nextModuleErrors).length > 0
      ) {
        setError("Impossible de charger les donnees du dashboard.");
      }

      writeJsonCache(scopedDashboardCacheKey, {
        timestamp: Date.now(),
        permissions: resolvedPermissions,
        summary: nextSummary,
        moduleStats: nextModuleStats,
        moduleErrors: nextModuleErrors,
      });

      setLoading(false);
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const canAccessEmployeesMenu = useMemo(
    () => permissions.some((permission) => EMPLOYEE_MENU_PERMISSIONS.includes(permission)),
    [permissions]
  );

  const canAccessSocieteMenu = useMemo(
    () => permissions.some((permission) => SOCIETE_MENU_PERMISSIONS.includes(permission)),
    [permissions]
  );

  const interfaces = useMemo(() => {
    const items = [];

    if (canAccessEmployeesMenu) {
      items.push({
        key: "employees",
        title: "Gestion employes",
        description: "Vue globale des employes et de la structure RH.",
        icon: PeopleAltIcon,
        color: "#2c767c",
        route: "/employes",
        metrics: [
          { label: "Total employes", value: summary.totalEmployees },
          { label: "Femmes", value: summary.femmes },
          { label: "Hommes", value: summary.hommes },
          { label: "Departements", value: summary.departements },
        ],
      });
    }

    if (permissions.includes("view_all_accidents")) {
      items.push({
        key: "accidents",
        title: "Accidents de travail",
        description: "Suivi des incidents et du volume declare.",
        icon: WarningAmberIcon,
        color: "#f59e0b",
        route: "/employes2",
        metrics: [
          { label: "Total dossiers", value: moduleStats.accidents?.total ?? 0 },
        ],
      });
    }

    if (permissions.includes("view_all_cimr")) {
      items.push({
        key: "cimr",
        title: "Gestion CIMR",
        description: "Affiliations, declarations et montant mensuel CIMR.",
        icon: AssessmentIcon,
        color: "#2563eb",
        route: "/cimr-dashboard",
        metrics: [
          { label: "Affiliations actives", value: moduleStats.cimr?.totalAffiliations ?? 0 },
          { label: "Declarations du mois", value: moduleStats.cimr?.declarationsThisMonth ?? 0 },
          { label: "Montant du mois", value: moduleStats.cimr?.totalAmountThisMonth ?? 0, format: "currency" },
        ],
      });
    }

    if (permissions.includes("view_all_mutuelle")) {
      items.push({
        key: "mutuelle",
        title: "Assurance",
        description: "Suivi des affiliations et operations mutuelle.",
        icon: LocalHospitalIcon,
        color: "#0ea5a3",
        route: "/mutuelle/dashboard",
        metrics: [
          { label: "Affiliations actives", value: moduleStats.mutuelle?.affiliationsActives ?? 0 },
          { label: "Affiliations resiliees", value: moduleStats.mutuelle?.affiliationsInactives ?? 0 },
          { label: "Operations en cours", value: moduleStats.mutuelle?.dossiersEnCours ?? 0 },
        ],
      });
    }

    if (permissions.includes("view_all_cnss")) {
      items.push({
        key: "cnss",
        title: "CNSS",
        description: "Affiliations, declarations et cotisations CNSS.",
        icon: SecurityIcon,
        color: "#0284c7",
        route: "/cnss/dashboard",
        metrics: [
          { label: "Affiliations actives", value: moduleStats.cnss?.affiliationsActif ?? 0 },
          { label: "Declarations en attente", value: moduleStats.cnss?.declarationsEnAttente ?? 0 },
          { label: "Montant CNSS", value: moduleStats.cnss?.montantCnss ?? 0, format: "currency" },
        ],
      });
    }

    if (permissions.includes("view_all_carrieres_formations")) {
      items.push({
        key: "carrieres-formations",
        title: "Carrieres & Formations",
        description: "Consolidation des indicateurs de mobilite et formation.",
        icon: SchoolIcon,
        color: "#7c3aed",
        route: "/carrieres-formations/dashboard-carrieres",
        metrics: [
          { label: "Nombre de postes", value: moduleStats.carrieres?.postesOccupes ?? 0 },
          { label: "Formations actives", value: moduleStats.formations?.formationsActives ?? 0 },
          { label: "Participants", value: moduleStats.formations?.participantsTotal ?? 0 },
        ],
      });
    }

    if (permissions.includes("view_all_conflits")) {
      items.push({
        key: "conflits",
        title: "Conflits",
        description: "Etat global des dossiers de conflits.",
        icon: HealthAndSafetyIcon,
        color: "#d97706",
        route: "/conflits",
        metrics: [
          { label: "Total conflits", value: moduleStats.conflits?.total ?? 0 },
          { label: "Ce mois", value: moduleStats.conflits?.thisMonth ?? 0 },
        ],
      });
    }

    if (permissions.includes("view_all_sanctions")) {
      items.push({
        key: "sanctions",
        title: "Sanctions",
        description: "Suivi des sanctions enregistrees.",
        icon: GavelIcon,
        color: "#dc2626",
        route: "/sanctions",
        metrics: [
          { label: "Total sanctions", value: moduleStats.sanctions?.total ?? 0 },
          { label: "Ce mois", value: moduleStats.sanctions?.thisMonth ?? 0 },
        ],
      });
    }

    if (canAccessSocieteMenu) {
      items.push({
        key: "societes",
        title: "Societe",
        description: "Referentiel des societes et structures associees.",
        icon: BusinessIcon,
        color: "#334155",
        route: "/societes",
        metrics: [
          { label: "Total societes", value: moduleStats.societes?.total ?? 0 },
        ],
      });
    }

    if (permissions.includes("view_all_users")) {
      items.push({
        key: "users",
        title: "Utilisateurs",
        description: "Pilotage des acces et comptes applicatifs.",
        icon: PersonAddAlt1Icon,
        color: "#6d28d9",
        route: "/users",
        metrics: [
          { label: "Total utilisateurs", value: moduleStats.users?.total ?? 0 },
        ],
      });
    }

    return items;
  }, [canAccessEmployeesMenu, canAccessSocieteMenu, moduleStats, permissions, summary]);

  const topSecondaryCards = useMemo(() => {
    const cards = [];

    if (permissions.includes("view_all_mutuelle") && moduleStats.mutuelle) {
      cards.push({
        key: "mutuelle-affiliations",
        title: "Affiliations assurance",
        value: moduleStats.mutuelle.affiliationsActives ?? 0,
        icon: LocalHospitalIcon,
        bgGradient: "linear-gradient(135deg, #26a69a 0%, #00897b 100%)",
      });
    }

    if (permissions.includes("view_all_cnss") && moduleStats.cnss) {
      cards.push({
        key: "cnss-attente",
        title: "CNSS en attente",
        value: moduleStats.cnss.declarationsEnAttente ?? 0,
        icon: SecurityIcon,
        bgGradient: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
      });
    }

    if (permissions.includes("view_all_cimr") && moduleStats.cimr) {
      cards.push({
        key: "cimr-declarations",
        title: "CIMR declarations",
        value: moduleStats.cimr.declarationsThisMonth ?? 0,
        icon: AssessmentIcon,
        bgGradient: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
      });
    }

    if (permissions.includes("view_all_carrieres_formations") && moduleStats.formations) {
      cards.push({
        key: "formations-actives",
        title: "Formations actives",
        value: moduleStats.formations.formationsActives ?? 0,
        icon: SchoolIcon,
        bgGradient: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
      });
    }

    if (permissions.includes("view_all_conflits") && moduleStats.conflits) {
      cards.push({
        key: "conflits-total",
        title: "Total conflits",
        value: moduleStats.conflits.total ?? 0,
        icon: HealthAndSafetyIcon,
        bgGradient: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
      });
    }

    if (permissions.includes("view_all_sanctions") && moduleStats.sanctions) {
      cards.push({
        key: "sanctions-total",
        title: "Total sanctions",
        value: moduleStats.sanctions.total ?? 0,
        icon: GavelIcon,
        bgGradient: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
      });
    }

    if (permissions.includes("view_all_users") && moduleStats.users) {
      cards.push({
        key: "users-total",
        title: "Utilisateurs",
        value: moduleStats.users.total ?? 0,
        icon: PersonAddAlt1Icon,
        bgGradient: "linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%)",
      });
    }

    if (canAccessSocieteMenu && moduleStats.societes) {
      cards.push({
        key: "societes-total",
        title: "Societes",
        value: moduleStats.societes.total ?? 0,
        icon: BusinessIcon,
        bgGradient: "linear-gradient(135deg, #334155 0%, #1e293b 100%)",
      });
    }

    if (cards.length < 2) {
      cards.push({
        key: "interfaces-disponibles",
        title: "Interfaces disponibles",
        value: interfaces.length,
        icon: AssessmentIcon,
        bgGradient: "linear-gradient(135deg, #0ea5a3 0%, #0f766e 100%)",
      });
    }

    if (cards.length < 2) {
      cards.push({
        key: "modules-synchronises",
        title: "Modules synchronises",
        value: Object.values(moduleStats).filter(Boolean).length,
        icon: ArrowForwardIcon,
        bgGradient: "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)",
      });
    }

    return cards.slice(0, 2);
  }, [canAccessSocieteMenu, interfaces.length, moduleStats, permissions]);

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          ...dynamicStyles,
          mt: "80px",
          bgcolor: DASHBOARD_COLORS.pageBg,
          height: "calc(100vh - 80px)",
          overflowY: "auto",
          overflowX: "hidden",
          p: { xs: 2, md: 4 },
          transition: "margin-left 0.3s ease, width 0.3s ease",
          scrollbarColor: `${DASHBOARD_COLORS.teal} #e6eef0`,
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: DASHBOARD_COLORS.teal,
            borderRadius: "8px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#e6eef0",
          },
        }}
      >
        <Stack spacing={2.5}>
          <Box>
            <Typography sx={{ fontSize: "1.6rem", fontWeight: 700, color: DASHBOARD_COLORS.textPrimary }}>
              Tableau de bord Accueil
            </Typography>
            <Typography sx={{ color: DASHBOARD_COLORS.textSecondary, mt: 0.5, fontSize: "0.92rem" }}>
              Donnees consolidees selon les interfaces visibles dans la navigation.
            </Typography>
          </Box>

          {error ? <Alert severity="warning">{error}</Alert> : null}

          {loading ? <LinearProgress sx={{ borderRadius: 2 }} /> : null}

          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} md={3}>
              <TopStatCard
                title="Total employes"
                value={summary.totalEmployees}
                icon={PeopleAltIcon}
                bgGradient={`linear-gradient(135deg, ${DASHBOARD_COLORS.teal} 0%, ${DASHBOARD_COLORS.tealLight} 100%)`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TopStatCard
                title="Departements"
                value={summary.departements}
                icon={BusinessIcon}
                bgGradient="linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)"
              />
            </Grid>
            {topSecondaryCards.map((card) => (
              <Grid item xs={12} sm={6} md={3} key={card.key}>
                <TopStatCard
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                  bgGradient={card.bgGradient}
                />
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 1.5 }}>
            <Typography sx={{ fontSize: "1.1rem", fontWeight: 700, color: DASHBOARD_COLORS.textPrimary, mb: 1.5 }}>
              Interfaces disponibles ({interfaces.length})
            </Typography>

            {interfaces.length === 0 ? (
              loading ? (
                <Alert severity="info">Chargement des interfaces...</Alert>
              ) : (
                <Alert severity="info">Aucune interface disponible pour ce profil utilisateur.</Alert>
              )
            ) : (
              <Grid container spacing={2.2}>
                {interfaces.map((item) => (
                  <Grid item xs={12} md={6} xl={4} key={item.key}>
                    <InterfaceCard
                      title={item.title}
                      description={item.description}
                      icon={item.icon}
                      color={item.color}
                      route={item.route}
                      metrics={item.metrics}
                      loading={loading}
                      error={Boolean(moduleErrors[item.key])}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Stack>
      </Box>
    </ThemeProvider>
  );
};

export default Dashboard;
