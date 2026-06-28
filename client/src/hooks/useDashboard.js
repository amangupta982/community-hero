import { useState, useEffect, useRef } from "react";

async function apiFetch(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
  return res.json();
}

export function useDashboard() {
  const [stats, setStats] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const timerRef = useRef(null);

  async function fetchStats() {
    try {
      const data = await apiFetch("/api/dashboard/stats");
      setStats(data);
      setLastUpdated(new Date());
    } catch {
      /* silent refresh failure */
    } finally {
      setLoading(false);
    }
  }

  async function fetchInsights() {
    try {
      const data = await apiFetch("/api/dashboard/insights");
      setInsights(data);
    } catch {
      /* show without insights */
    } finally {
      setLoadingInsights(false);
    }
  }

  useEffect(() => {
    fetchStats();
    fetchInsights();
    timerRef.current = setInterval(fetchStats, 20_000);
    return () => clearInterval(timerRef.current);
  }, []);

  return { stats, insights, loading, loadingInsights, lastUpdated, refresh: fetchStats };
}
