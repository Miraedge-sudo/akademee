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
        // A year only counts as "usable" when it actually has data — otherwise
        // the dashboard filters on an empty year and shows 0 everywhere
        // (while totalUsers stays global, which looks like a bug).
        const hasData = (y) => (y.students || 0) + (y.teachers || 0) + (y.classes || 0) > 0;
        const saved = localStorage.getItem("akademee:selectedYearId");
        const savedYear = saved ? list.find((y) => y.id === saved) : null;
        const current = list.find((y) => y.isCurrent) || null;
        const dataYear = list.find(hasData) || null;

        // Priority: the ACTIVE year is always selected automatically (the
        // dashboard must show the active year's data). Fallbacks only kick in
        // when no year is flagged active: saved explicit choice (if usable) →
        // any year with data → first year. The admin can still switch to
        // another year at runtime via the year selector.
        let next = null;
        if (current && hasData(current)) next = current.id;
        else if (current) next = current.id;
        else if (savedYear && hasData(savedYear)) next = savedYear.id;
        else if (dataYear) next = dataYear.id;
        else if (list.length > 0) next = list[0].id;

        setSelectedYearId(next);
        if (next) localStorage.setItem("akademee:selectedYearId", next);
        else localStorage.removeItem("akademee:selectedYearId");
      } else {
        setSelectedYearId(null);
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
