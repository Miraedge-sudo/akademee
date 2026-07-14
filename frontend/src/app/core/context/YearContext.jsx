import { createContext, useState, useEffect, useContext, useCallback } from "react";
import { getAcademicYears } from "../api/academicYearService";

export const YearContext = createContext();

export function YearProvider({ children }) {
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
        const current = list.find((y) => y.isCurrent) || list[0];
        setSelectedYearId((prev) => prev || current.id);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  const refreshYears = useCallback(async () => {
    await fetchYears();
  }, [fetchYears]);

  const value = {
    selectedYearId,
    setSelectedYearId,
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
