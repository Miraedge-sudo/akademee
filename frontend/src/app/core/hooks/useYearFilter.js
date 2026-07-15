import { useContext } from "react";
import { YearContext } from "../context/YearContext";

/**
 * Hook qui retourne un objet `{ academicYearId }` à passer dans les params
 * des appels API. Si aucune année n'est sélectionnée, retourne `{}`.
 *
 * @returns {{ academicYearId?: string }}
 *
 * @example
 * const yearFilter = useYearFilter();
 * const students = await getStudents({ ...yearFilter, search: "..." });
 */
export function useYearFilter() {
  const { selectedYearId } = useContext(YearContext);
  return selectedYearId ? { academicYearId: selectedYearId } : {};
}
