import { createContext, useState, useEffect, useCallback } from "react";
import { getAcademicYears } from "../api/academicYearService";
import { useAuth } from "../hooks/useAuth";

export const YearContext = createContext();

export function YearProvider({ children }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchYears = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAcademicYears();
      const list = data?.years || [];
      setYears(list);
      if (list.length > 0) {
        const saved = localStorage.getItem("akademee:selectedYearId");
        const savedValid = saved && list.some((y) => y.id === saved);
        const current = list.find((y) => y.isCurrent) || list[0];
        const next = savedValid ? saved : current.id;
        setSelectedYearId((prev) => prev || next);
        if (savedValid) localStorage.setItem("akademee:selectedYearId", next);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Academic years are private data. Loading them from a public page such as
    // /login returns 401, which previously caused the auth redirect loop.
    if (authLoading) return;

    if (isAuthenticated) {
      fetchYears();
    } else {
      setYears([]);
      setSelectedYearId(null);
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, fetchYears]);

  const refreshYears = useCallback(async () => {
    await fetchYears();
  }, [fetchYears]);

  const selectYear = useCallback((id) => {
    if (id) localStorage.setItem("akademee:selectedYearId", id);
    setSelectedYearId(id);
  }, []);

  const value = {
    selectedYearId,
    setSelectedYearId: selectYear,
    years,
    loading,
    hasYears: years.length > 0,
    refreshYears,
  };

  return (
    <YearContext.Provider value={value}>
      {children}
    </YearContext.Provider>
  );
}
