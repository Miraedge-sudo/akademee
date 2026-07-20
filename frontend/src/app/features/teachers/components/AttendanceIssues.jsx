import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const STATUS_STYLE = {
  absent: { bg: 'rgba(239,68,68,.09)',   color: '#EF4444' },
  late:   { bg: 'rgba(245,158,11,.09)',  color: '#F59E0B' },
};

const SAMPLE_ATTENDANCE = [
  { name: 'Jean-Paul Mbeki', cls: 'Form 4A', time: 'Today, 08:45',  status: 'absent', avatarBg: '#FEE2E2', avatarText: '#EF4444' },
  { name: 'Claire Ateba',    cls: 'Form 3B', time: 'Today, 07:30',  status: 'late',   avatarBg: '#FEF3C7', avatarText: '#F59E0B' },
  { name: 'Boris Nguema',    cls: 'Form 5A', time: 'Yesterday',      status: 'absent', avatarBg: '#FEE2E2', avatarText: '#EF4444' },
  { name: 'Sara Mekongo',    cls: 'Form 4A', time: 'Yesterday',      status: 'absent', avatarBg: '#FEE2E2', avatarText: '#EF4444' },];

function initials(name) {
  return name.split(' ').map((w) => w[0]).join('');
}

export default function AttendanceIssues({ data = SAMPLE_ATTENDANCE }) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100">
          <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
          {t('teacher.attendanceIssues.title')}
        </div>
        <button
          onClick={() => navigate('/dashboard/attendance')}
          className="text-[12.5px] font-semibold text-teal-700 dark:text-teal-400 flex items-center gap-1 hover:gap-2 transition-all"
        >
          {t('teacher.attendanceIssues.fullReport')} <ArrowRight size={13} />
        </button>
      </div>

      <div className="divide-y divide-surface-50 dark:divide-surface-700/50">
        {data.map((a, i) => {
          const style = STATUS_STYLE[a.status] || STATUS_STYLE.absent;
          return (
            <div key={i} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold flex-shrink-0"
                  style={{ background: a.avatarBg, color: a.avatarText }}
                >
                  {initials(a.name)}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-surface-900 dark:text-surface-100">{a.name}</div>
                  <div className="text-[11.5px] text-surface-400">{a.cls} · {a.time}</div>
                </div>
              </div>
              <span
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: style.bg, color: style.color }}
              >
                {a.status === 'absent' ? t('teacher.attendanceIssues.absent') : t('teacher.attendanceIssues.late')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
