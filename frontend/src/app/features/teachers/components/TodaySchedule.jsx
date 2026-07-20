/**
 * TodaySchedule — shows the teacher's classes for today with time, subject, class, room.
 */
import { MapPin, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SAMPLE_SCHEDULE = [
  { time: '07:30', end: '08:30', subject: 'Mathematics', cls: 'Form 4A', room: 'R.12', color: '#085041', status: 'active' },
  { time: '08:45', end: '09:45', subject: 'Mathematics', cls: 'Form 3B', room: 'R.08', color: '#3B82F6', status: 'upcoming' },
  { time: '10:00', end: '11:00', subject: 'Computer Sci.', cls: 'Form 5A', room: 'R.Lab', color: '#8B5CF6', status: 'upcoming' },
  { time: '11:15', end: '12:15', subject: 'Mathematics', cls: 'Lower 6th Sci.', room: 'R.15', color: '#F59E0B', status: 'upcoming' },
];

function ScheduleItem({ item, idx }) {
  const { t } = useTranslation('common');
  const isActive = item.status === 'active';

  return (
    <div
      className={`flex items-center gap-3.5 px-3.5 py-3 rounded-[10px] border-[1.5px] cursor-pointer relative overflow-hidden transition-all duration-200 hover:translate-x-1 ${
        isActive
          ? 'border-teal-600/50 bg-teal-50 dark:bg-teal-900/10'
          : 'border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50 hover:border-teal-400/50 hover:bg-teal-50 dark:hover:bg-teal-900/10'
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
          {t('teacher.attendanceIssues.now')}
        </span>
      )}
    </div>
  );
}

export default function TodaySchedule({ schedule = SAMPLE_SCHEDULE }) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          {t('teacher.schedule.title')}
        </div>
        <button
          onClick={() => navigate('/dashboard/my-classes')}
          className="text-[12.5px] font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-1 hover:gap-2 transition-all"
        >
          {t('teacher.schedule.fullTimetable')} <ArrowRight size={13} />
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {schedule.length === 0 ? (
          <p className="text-sm text-surface-400 text-center py-6">{t('teacher.schedule.noClasses')}</p>
        ) : (
          schedule.map((item, idx) => <ScheduleItem key={idx} item={item} idx={idx} />)
        )}
      </div>
    </div>
  );
}
