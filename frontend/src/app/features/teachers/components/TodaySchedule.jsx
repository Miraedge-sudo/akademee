/**
 * TodaySchedule — shows the teacher's classes for today with time, subject, class, room.
 * Real data from GET /api/timetable/today?teacherId= (current teacher).
 */
import { useEffect, useState } from "react";
import { FiMapPin as MapPin } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../core/hooks/useAuth";
import { getToday, getGrid } from "../../../core/api/timetableService";
import { getSubjectColor } from "../../timetable/utils/subjectColors";

const fmt = (t) => (t ? String(t).slice(0, 5) : "");

// Statut du cours : 'active' si l'heure actuelle est dans le créneau
function computeStatus(startTime, endTime) {
  const now = new Date();
  const toMin = (t) => {
    const [h, m] = String(t || "00:00").split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const nowMin = now.getHours() * 60 + now.getMinutes();
  if (nowMin >= toMin(startTime) && nowMin <= toMin(endTime)) return "active";
  return "upcoming";
}

function ScheduleItem({ item, idx }) {
  const { t } = useTranslation("common");
  const isActive = item.status === "active";

  return (
    <div
      className={`flex items-center gap-3.5 px-3.5 py-3 rounded-[10px] border-[1.5px] cursor-pointer relative overflow-hidden transition-all duration-200 hover:translate-x-1 ${
        isActive
          ? "border-teal-600/50 bg-teal-50 dark:bg-teal-900/10"
          : "border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50 hover:border-teal-400/50 hover:bg-teal-50 dark:hover:bg-teal-900/10"
      }`}
      style={{ animationDelay: `${0.08 * idx}s` }}
    >
      {isActive && (
        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-teal-600 rounded-r-sm" />
      )}

      {/* Time */}
      <div className="text-center min-w-[48px] ml-1">
        <div className="text-[13px] font-bold text-surface-900 dark:text-surface-100">{item.time}</div>
        <div className="text-[11px] text-surface-400">{item.end}</div>
      </div>

      {/* divider */}
      <div className="w-px h-8 bg-surface-100 dark:bg-surface-700 flex-shrink-0" />

      {/* dot */}
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />

      {/* info */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold text-surface-900 dark:text-surface-100 truncate">{item.subject}</div>
        <div className="text-[12px] text-surface-400">{item.cls}</div>
      </div>

      {/* room */}
      <div className="flex items-center gap-1 text-[11px] text-surface-400 flex-shrink-0">
        <MapPin size={11} className="text-surface-300" />
        {item.room}
      </div>

      {isActive && (
        <span className="text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-900 dark:text-teal-400 border border-teal-100 dark:border-teal-800 flex-shrink-0">
          {t("teacher.attendanceIssues.now")}
        </span>
      )}
    </div>
  );
}

export default function TodaySchedule() {
  const { t, i18n } = useTranslation("common");
  const isFr = i18n.language === "fr";
  const { user } = useAuth();
  const teacherId = user?.id;
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  // true = l'enseignant a des cours publiés dans la semaine (mais pas aujourd'hui)
  // false = aucun cours publié du tout → l'emploi du temps n'est pas encore configuré
  const [hasWeeklyLessons, setHasWeeklyLessons] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    if (!teacherId) {
      setSchedule([]);
      setHasWeeklyLessons(false);
      setLoading(false);
      return () => {
        active = false;
      };
    }
    // Cours du jour + grille de la semaine (pour distinguer « aucun cours
    // aujourd'hui » de « emploi du temps pas encore publié »).
    Promise.all([
      getToday({ teacherId }),
      getGrid({ teacherId }).catch(() => ({ entries: [] })),
    ])
      .then(([todayData, gridData]) => {
        if (!active) return;
        setHasWeeklyLessons((gridData?.entries || []).length > 0);
        setSchedule(
          (todayData?.entries || []).map((e) => ({
            id: e.id,
            time: fmt(e.startTime),
            end: fmt(e.endTime),
            subject: e.subjectName || "—",
            cls: e.className || "—",
            room: e.roomName || "—",
            color: getSubjectColor(e.subjectId, e.subjectName).solid,
            status: computeStatus(e.startTime, e.endTime),
          }))
        );
      })
      .catch(() => {
        if (active) {
          setSchedule([]);
          setHasWeeklyLessons(false);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [teacherId]);

  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          {t("teacher.schedule.title")}
        </div>
        {!loading && schedule.length > 0 && (
          <span className="text-[11px] font-semibold text-surface-400 bg-surface-50 dark:bg-surface-800 px-2.5 py-1 rounded-full">
            {schedule.length} classes
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[52px] rounded-[10px] bg-surface-50 dark:bg-surface-900 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {schedule.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-surface-400">
                {hasWeeklyLessons === false
                  ? t("teacher.schedule.notPublished")
                  : t("teacher.schedule.noClasses")}
              </p>
              <p className="text-[11px] text-surface-300 mt-1.5">
                {hasWeeklyLessons === false
                  ? t("teacher.schedule.notPublishedHint")
                  : `${t("teacher.schedule.todayIs")} ${new Date().toLocaleDateString(
                      isFr ? "fr" : "en",
                      { weekday: "long" }
                    )}`}
              </p>
            </div>
          ) : (
            schedule.map((item, idx) => <ScheduleItem key={item.id || idx} item={item} idx={idx} />)
          )}
        </div>
      )}
    </div>
  );
}
