import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FiCalendar } from "react-icons/fi";
import { getAcademicYears } from "../../core/api/academicYearService";

export default function YearSelector({ value, onChange, showAll = true }) {
  const { i18n } = useTranslation("common");
  const lang = i18n.language === "fr" ? "fr" : "en";
  const [years, setYears] = useState([]);

  useEffect(() => {
    getAcademicYears()
      .then((data) => {
        const list = data?.years || [];
        setYears(list);
        if (!value && list.length > 0) {
          const current = list.find((y) => y.isCurrent) || list[0];
          onChange(current.id);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative">
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full h-10 pl-9 pr-8 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 text-sm text-surface-800 dark:text-surface-100 outline-none appearance-none cursor-pointer focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10 transition-all"
      >
        {showAll && (
          <option value="">
            {lang === "fr" ? "Toutes les années" : "All years"}
          </option>
        )}
        {years.map((y) => (
          <option key={y.id} value={y.id}>
            {y.name} {y.isCurrent ? `(${lang === "fr" ? "en cours" : "current"})` : ""}
          </option>
        ))}
      </select>
      <FiCalendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
    </div>
  );
}
