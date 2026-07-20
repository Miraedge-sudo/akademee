/**
 * TeacherGreeting — animated header with teacher name, date badge and class/grade summary.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'greetingMorning';
  if (h < 18) return 'greetingAfternoon';
  return 'greetingEvening';
}

export default function TeacherGreeting({ teacher, classesToday = 0, pendingGrades = 0, pc = '#085041' }) {
  const { t, i18n } = useTranslation('common');
  const isFr = i18n.language === 'fr';
  const now = new Date();
  const dateDay = now.getDate();
  const dateMonth = now.toLocaleDateString(isFr ? 'fr' : 'en',
    { month: 'long', year: 'numeric' }
  );
  const greetingKey = useMemo(() => getGreeting(), []);

  const gradeText = pendingGrades > 0
    ? t('teacher.greeting.pendingGrades', { count: pendingGrades })
    : t('teacher.greeting.noPendingGrades');

  return (
    <div className="flex items-end justify-between flex-wrap gap-4 mb-7">
      {/* Left — greeting */}
      <div className="animate-[fadeUp_.55s_cubic-bezier(.16,1,.3,1)_both]">
        <p
          className="text-[11px] font-semibold tracking-[1.5px] uppercase mb-1.5"
          style={{ color: pc }}
        >
          {t('teacher.greeting.title')}
        </p>
        <h1 className="font-display text-[clamp(22px,3vw,30px)] font-bold text-surface-900 dark:text-surface-50 leading-tight">
          {t(`teacher.greeting.${greetingKey}`)},{' '}
          <span style={{ color: pc }}>{teacher?.firstName ? `${teacher.firstName}` : 'Teacher'}</span> 👋
        </h1>
        <p className="text-sm text-surface-400 mt-1">
          {t('teacher.greeting.classesToday', { count: classesToday })}
          {pendingGrades > 0 && (
            <>
              {' '}{t('teacher.greeting.and')}{' '}
              <strong className="text-amber-600">{gradeText}</strong>
            </>
          )}.
        </p>
      </div>

      {/* Right — date badge */}
      <div className="animate-[fadeUp_.55s_.08s_cubic-bezier(.16,1,.3,1)_both] flex-shrink-0">
        <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl px-5 py-3 text-right shadow-sm">
          <div className="font-display text-[28px] font-bold text-surface-900 dark:text-surface-50 leading-none">{dateDay}</div>
          <div className="text-[10px] font-semibold tracking-[1.2px] uppercase text-surface-400 mt-1">{dateMonth}</div>
        </div>
      </div>
    </div>
  );
}
