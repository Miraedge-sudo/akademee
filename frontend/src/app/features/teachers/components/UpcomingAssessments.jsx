/**
 * UpcomingAssessments — list of upcoming exams/tests with date box and type badge.
 */

const SAMPLE_ASSESSMENTS = [
  { day: '18', month: 'Jan', name: 'Sequence 3 — Mathematics', meta: 'Form 4A · 2h', type: 'Exam',  typeColor: '#085041', typeBg: 'rgba(8,80,65,.07)' },
  { day: '21', month: 'Jan', name: 'Sequence 3 — Mathematics', meta: 'Form 3B · 2h', type: 'Exam',  typeColor: '#085041', typeBg: 'rgba(8,80,65,.07)' },
  { day: '24', month: 'Jan', name: 'Test — Computer Science',  meta: 'Form 5A · 1h', type: 'Test',  typeColor: '#8B5CF6', typeBg: 'rgba(139,92,246,.09)' },
];

export default function UpcomingAssessments({ assessments = SAMPLE_ASSESSMENTS }) {
  return (
    <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl p-5 shadow-sm flex-1">
      <div className="flex items-center gap-2.5 text-[15px] font-bold text-surface-900 dark:text-surface-100 mb-4">
        <span className="w-[3px] h-[18px] rounded bg-[#085041]" />
        Upcoming assessments
      </div>

      <div className="divide-y divide-surface-50 dark:divide-surface-700/50">
        {assessments.map((a, i) => (
          <div key={i} className="flex items-center gap-3 py-3">
            {/* Date box */}
            <div className="w-11 flex-shrink-0 text-center bg-surface-50 dark:bg-surface-900/50 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-[10px] py-1.5 px-1">
              <div className="font-display text-[18px] font-bold text-surface-900 dark:text-surface-100 leading-none">{a.day}</div>
              <div className="text-[9px] font-bold tracking-[1px] uppercase text-surface-400 mt-0.5">{a.month}</div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-bold text-surface-900 dark:text-surface-100 truncate mb-0.5">{a.name}</div>
              <div className="text-[12px] text-surface-400">{a.meta}</div>
            </div>

            {/* Badge */}
            <span
              className="text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: a.typeBg, color: a.typeColor }}
            >
              {a.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
