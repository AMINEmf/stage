import { useState, useCallback } from "react";
import apiClient from "../../../../services/apiClient";

const SESSIONS_CACHE_KEY = "formations_sessions_cache_v1";
const SESSIONS_CACHE_TTL_MS = 2 * 60 * 1000;

const sessionsMemoryCache = new Map();
const inFlightRequests = new Map();

const loadSessionsCache = () => {
  try {
    const raw = localStorage.getItem(SESSIONS_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const saveSessionsCacheEntry = (formationId, sessions) => {
  const key = String(formationId);
  const payload = {
    ts: Date.now(),
    sessions: Array.isArray(sessions) ? sessions : [],
  };

  sessionsMemoryCache.set(key, payload);

  try {
    const current = loadSessionsCache();
    current[key] = payload;
    localStorage.setItem(SESSIONS_CACHE_KEY, JSON.stringify(current));
  } catch {
    // Ignore localStorage write failures.
  }
};

const getSessionsCacheEntry = (formationId) => {
  const key = String(formationId);
  const memoryEntry = sessionsMemoryCache.get(key);
  if (memoryEntry) return memoryEntry;

  const storageEntry = loadSessionsCache()[key];
  if (!storageEntry) return null;

  sessionsMemoryCache.set(key, storageEntry);
  return storageEntry;
};

const normalizeSessionsResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const fetchSessionsFromApi = async (formationId) => {
  const res = await apiClient.get(`/formations/${formationId}/sessions`, {
    timeout: 12000,
  });
  return normalizeSessionsResponse(res?.data);
};

export async function prefetchFormationSessions(formationId, options = {}) {
  if (!formationId) return [];

  const { forceRefresh = false, knownSessionsCount = null } = options;
  const key = String(formationId);
  const now = Date.now();

  const cachedEntry = getSessionsCacheEntry(formationId);
  const hasCachedData = Array.isArray(cachedEntry?.sessions);
  const cacheIsFresh = hasCachedData && (now - (cachedEntry?.ts || 0) < SESSIONS_CACHE_TTL_MS);

  if (hasCachedData && !forceRefresh && cacheIsFresh) {
    return cachedEntry.sessions;
  }

  if (!forceRefresh && !hasCachedData && Number(knownSessionsCount) === 0) {
    saveSessionsCacheEntry(formationId, []);
    return [];
  }

  if (inFlightRequests.has(key)) {
    try {
      return await inFlightRequests.get(key);
    } catch (err) {
      if (hasCachedData) return cachedEntry.sessions;
      throw err;
    }
  }

  const requestPromise = (async () => {
    const freshSessions = await fetchSessionsFromApi(formationId);
    saveSessionsCacheEntry(formationId, freshSessions);
    return freshSessions;
  })();

  inFlightRequests.set(key, requestPromise);

  try {
    return await requestPromise;
  } catch (err) {
    if (hasCachedData) return cachedEntry.sessions;
    throw err;
  } finally {
    inFlightRequests.delete(key);
  }
}

/**
 * Hook for managing sessions (planning) of a formation.
 *
 * @param {number|string} formationId
 * @param {{ sessionsCount?: number|null, initialSessions?: Array|null }} options
 */
export function useFormationSessions(formationId, options = {}) {
  const { sessionsCount = null, initialSessions = null } = options;

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSessions = useCallback(async (fetchOptions = {}) => {
    if (!formationId) {
      setSessions([]);
      setLoading(false);
      setError(null);
      return [];
    }

    const { forceRefresh = false, silent = false } = fetchOptions;
    const now = Date.now();
    const parsedSessionsCount = Number(sessionsCount);
    const knownSessionsCount = Number.isFinite(parsedSessionsCount) ? parsedSessionsCount : null;

    if (Array.isArray(initialSessions) && initialSessions.length > 0) {
      const existing = getSessionsCacheEntry(formationId);
      if (!existing) {
        saveSessionsCacheEntry(formationId, initialSessions);
      }
    }

    const cachedEntry = getSessionsCacheEntry(formationId);
    const hasCachedData = Array.isArray(cachedEntry?.sessions);
    const cacheIsFresh = hasCachedData && (now - (cachedEntry?.ts || 0) < SESSIONS_CACHE_TTL_MS);

    if (hasCachedData) {
      setSessions(cachedEntry.sessions);
      setError(null);
      if (!forceRefresh && cacheIsFresh) {
        setLoading(false);
        return cachedEntry.sessions;
      }
    }

    if (!forceRefresh && !hasCachedData && knownSessionsCount === 0) {
      saveSessionsCacheEntry(formationId, []);
      setSessions([]);
      setError(null);
      setLoading(false);
      return [];
    }

    setLoading(!silent && !hasCachedData);
    setError(null);

    try {
      const freshSessions = await prefetchFormationSessions(formationId, {
        forceRefresh,
        knownSessionsCount,
      });
      setSessions(freshSessions);
      setError(null);
      return freshSessions;
    } catch (err) {
      console.error("useFormationSessions fetch error:", err);
      if (!hasCachedData) {
        setError("Impossible de charger les séances.");
        setSessions([]);
      }
      return hasCachedData ? cachedEntry.sessions : [];
    } finally {
      setLoading(false);
    }
  }, [formationId, sessionsCount, initialSessions]);

  const createSession = useCallback(async (data) => {
    const res = await apiClient.post(`/formations/${formationId}/sessions`, data);
    setSessions((prev) => {
      const next = [...prev, res.data];
      if (formationId) saveSessionsCacheEntry(formationId, next);
      return next;
    });
    return res.data;
  }, [formationId]);

  const updateSession = useCallback(async (sessionId, data) => {
    const res = await apiClient.put(`/sessions/${sessionId}`, data);
    setSessions((prev) => {
      const next = prev.map((s) => (s.id === sessionId ? res.data : s));
      if (formationId) saveSessionsCacheEntry(formationId, next);
      return next;
    });
    return res.data;
  }, [formationId]);

  const deleteSession = useCallback(async (sessionId) => {
    await apiClient.delete(`/sessions/${sessionId}`);
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== sessionId);
      if (formationId) saveSessionsCacheEntry(formationId, next);
      return next;
    });
  }, [formationId]);

  return {
    sessions,
    loading,
    error,
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
  };
}
