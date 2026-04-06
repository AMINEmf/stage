import { useState, useCallback } from "react";
import apiClient from "../../../../services/apiClient";

const SMART_SUGGESTIONS_CACHE_KEY = "formations_smart_suggestions_cache_v1";
const SMART_SUGGESTIONS_TTL_MS = 2 * 60 * 1000;

const suggestionsMemoryCache = new Map();
const suggestionsInFlightRequests = new Map();

const loadSmartSuggestionsCache = () => {
  try {
    const raw = localStorage.getItem(SMART_SUGGESTIONS_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const saveSmartSuggestionsCacheEntry = (formationId, suggestions) => {
  const key = String(formationId);
  const payload = {
    ts: Date.now(),
    suggestions: Array.isArray(suggestions) ? suggestions : [],
  };

  suggestionsMemoryCache.set(key, payload);

  try {
    const current = loadSmartSuggestionsCache();
    current[key] = payload;
    localStorage.setItem(SMART_SUGGESTIONS_CACHE_KEY, JSON.stringify(current));
  } catch {
    // Ignore localStorage write failures.
  }
};

const getSmartSuggestionsCacheEntry = (formationId) => {
  const key = String(formationId);
  const memoryEntry = suggestionsMemoryCache.get(key);
  if (memoryEntry) return memoryEntry;

  const storageEntry = loadSmartSuggestionsCache()[key];
  if (!storageEntry) return null;

  suggestionsMemoryCache.set(key, storageEntry);
  return storageEntry;
};

const normalizeSuggestionsResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const fetchSmartSuggestionsFromApi = async (formationId) => {
  const res = await apiClient.get(`/formations/${formationId}/smart-suggestions`, {
    timeout: 12000,
  });
  return normalizeSuggestionsResponse(res?.data);
};

export async function prefetchSmartSuggestions(formationId, options = {}) {
  if (!formationId) return [];

  const { forceRefresh = false } = options;
  const key = String(formationId);
  const now = Date.now();

  const cachedEntry = getSmartSuggestionsCacheEntry(formationId);
  const hasCachedData = Array.isArray(cachedEntry?.suggestions);
  const cacheIsFresh = hasCachedData && (now - (cachedEntry?.ts || 0) < SMART_SUGGESTIONS_TTL_MS);

  if (hasCachedData && !forceRefresh && cacheIsFresh) {
    return cachedEntry.suggestions;
  }

  if (suggestionsInFlightRequests.has(key)) {
    try {
      return await suggestionsInFlightRequests.get(key);
    } catch (err) {
      if (hasCachedData) return cachedEntry.suggestions;
      throw err;
    }
  }

  const requestPromise = (async () => {
    const freshSuggestions = await fetchSmartSuggestionsFromApi(formationId);
    saveSmartSuggestionsCacheEntry(formationId, freshSuggestions);
    return freshSuggestions;
  })();

  suggestionsInFlightRequests.set(key, requestPromise);

  try {
    return await requestPromise;
  } catch (err) {
    if (hasCachedData) return cachedEntry.suggestions;
    throw err;
  } finally {
    suggestionsInFlightRequests.delete(key);
  }
}

/**
 * Hook for fetching smart-scored participant suggestions for a formation.
 *
 * Each suggestion contains:
 *   id, name, matricule, department,
 *   formation_count, last_training_date, months_since_training,
 *   skill_gap, score (0-100), domain_match, reasons[]
 *
 * @param {number|string} formationId
 */
export function useSmartSuggestions(formationId) {
  const [suggestions, setSuggestions]  = useState([]);
  const [loading, setLoading]          = useState(false);
  const [error, setError]              = useState(null);

  const fetchSuggestions = useCallback(async (options = {}) => {
    if (!formationId) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return [];
    }

    const { forceRefresh = false, silent = false } = options;
    const now = Date.now();

    const cachedEntry = getSmartSuggestionsCacheEntry(formationId);
    const hasCachedData = Array.isArray(cachedEntry?.suggestions);
    const cacheIsFresh = hasCachedData && (now - (cachedEntry?.ts || 0) < SMART_SUGGESTIONS_TTL_MS);

    if (hasCachedData) {
      setSuggestions(cachedEntry.suggestions);
      setError(null);
      if (!forceRefresh && cacheIsFresh) {
        setLoading(false);
        return cachedEntry.suggestions;
      }
    }

    setLoading(!silent && !hasCachedData);
    setError(null);

    try {
      const freshSuggestions = await prefetchSmartSuggestions(formationId, { forceRefresh });
      setSuggestions(freshSuggestions);
      setError(null);
      return freshSuggestions;
    } catch (err) {
      console.error("useSmartSuggestions error:", err);
      if (!hasCachedData) {
        setError("Impossible de charger les suggestions intelligentes.");
        setSuggestions([]);
      }
      return hasCachedData ? cachedEntry.suggestions : [];
    } finally {
      setLoading(false);
    }
  }, [formationId]);

  /** Optimistically remove after the employee is added as participant */
  const removeFromSuggestions = useCallback((employeId) => {
    setSuggestions((prev) => {
      const next = prev.filter((s) => s.id !== employeId);
      if (formationId) {
        saveSmartSuggestionsCacheEntry(formationId, next);
      }
      return next;
    });
  }, [formationId]);

  return { suggestions, loading, error, fetchSuggestions, removeFromSuggestions };
}
