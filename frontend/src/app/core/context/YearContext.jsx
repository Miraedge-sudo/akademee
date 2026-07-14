import { createContext, useState, useEffect, useContext } from "react";
import { getAcademicYears } from "../api/academicYearService";

export const YearContext = createContext();

export function YearProvider({ children }) {
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [years, setYears] = useState([]);

  useEffect(() => {
    getAcademicYears()
      .then((data) => {
        const list = data?.years || [];
        setYears(list);
        if (list.length > 0) {
          const current = list.find((y) => y.isCurrent) || list[0];
          setSelectedYearId(current.id);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <YearContext.Provider value={{ selectedYearId, setSelectedYearId, years }}>
      {children}
    </YearContext.Provider>
  );
}
