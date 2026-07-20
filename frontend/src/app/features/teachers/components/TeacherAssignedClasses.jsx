/**
 * TeacherAssignedClasses — Beautiful, animated grid of classrooms assigned to the teacher.
 *
 * Features:
 *  - Each class is displayed as an interactive card with gradient header
 *  - Shows class name, level/series, student count, subjects taught
 *  - Main teacher badge when applicable
 *  - Staggered fade-up animations on mount
 *  - Hover effects with elevation and micro-interactions
 *  - Quick-action buttons per class
 *  - Responsive grid layout
 */
import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Users,
  GraduationCap,
  ClipboardCheck,
  TrendingUp,
  Star,
  ArrowRight,
  Search,
  XCircle,
  Eye,
} from 'lucide-react';
import { getEnrollments } from '../../../core/api/enrollmentService';

// ── Color palette for class cards ──
const CARD_COLORS = [
  { gradient: 'from-emerald-600 to-teal-500', badge: '#085041', bg: 'rgba(8,80,65,.06)' },
  { gradient: 'from-blue-600 to-indigo-500', badge: '#3B82F6', bg: 'rgba(59,130,246,.06)' },
  { gradient: 'from-violet-600 to-purple-500', badge: '#8B5CF6', bg: 'rgba(139,92,246,.06)' },
  { gradient: 'from-amber-500 to-orange-500', badge: '#F59E0B', bg: 'rgba(245,158,11,.06)' },
  { gradient: 'from-rose-500 to-pink-500', badge: '#EC4899', bg: 'rgba(236,72,153,.06)' },
  { gradient: 'from-cyan-600 to-sky-500', badge: '#06B6D4', bg: 'rgba(6,182,212,.06)' },
];

function getCardColor(index) {
  return CARD_COLORS[index % CARD_COLORS.length];
}

// ── Color palette for student avatars ──
const AVATAR_COLORS = [
  { bg: '#E1F5EE', text: '#085041' },
  { bg: '#EFF6FF', text: '#3B82F6' },
  { bg: '#F5F3FF', text: '#8B5CF6' },
  { bg: '#FFF7ED', text: '#F59E0B' },
  { bg: '#FCE7F3', text: '#EC4899' },
  { bg: '#ECFDF5', text: '#14B8A6' },
];

function getAvatarColors(name = '') {
  const idx = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

// ── Class Card ──
function ClassCard({ cls, subjects = [], isMainTeacher, index, onTakeAttendance, onViewStudents }) {
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const colors = getCardColor(index);
  const studentCount = cls.studentCount || 0;
  const capacity = cls.capacity || 0;
  const occupancyPct = capacity > 0 ? Math.min(Math.round((studentCount / capacity) * 100), 100) : 0;
  const classSubjects = subjects.filter(
    (s) => String(s.classId) === String(cls.id)
  );

  return (
    <div
      className="group relative bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 shadow-sm overflow-hidden transition-all duration-500 hover:shadow-xl"
      style={{
        animation: `tacFadeUp 0.6s ${0.08 * index}s cubic-bezier(.16,1,.3,1) both`,
        transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Gradient header ── */}
      <div
        className={`relative bg-gradient-to-r ${colors.gradient} px-5 pt-5 pb-14 overflow-hidden`}
      >
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-6 -right-4 w-16 h-16 rounded-full bg-white/5" />
        <div className="absolute top-2 left-12 w-8 h-8 rounded-full bg-white/5" />

        {/* Main teacher badge */}
        {isMainTeacher && (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] font-bold shadow-sm">
            <Star size={10} fill="white" />
            <span>{t('teacher.assignedClasses.mainTeacher')}</span>
          </div>
        )}

        {/* Class icon */}
        <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3 shadow-sm">
          <BookOpen size={18} className="text-white" />
        </div>

        {/* Class name */}
        <h3 className="text-[18px] font-bold text-white leading-tight mb-1 relative z-10">
          {cls.name || 'Unnamed Class'}
        </h3>

        {/* Level & Series */}
        {(cls.levelName || cls.seriesName) && (
          <p className="text-white/70 text-[12px] font-medium relative z-10">
            {[cls.levelName, cls.seriesName].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {/* ── Content ── */}
      <div className="px-5 pb-5 -mt-8 relative z-10">
        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white dark:bg-surface-800 rounded-xl p-3 text-center shadow-sm border border-surface-50 dark:border-surface-700/50">
            <div className="flex items-center justify-center gap-1 text-surface-600 dark:text-surface-300 mb-0.5">
              <Users size={13} />
            </div>
            <div className="text-[16px] font-extrabold text-surface-900 dark:text-surface-100">
              {studentCount}
            </div>
            <div className="text-[9px] text-surface-400 font-medium uppercase tracking-wider">{t('teacher.assignedClasses.students')}</div>
          </div>
          <div className="bg-white dark:bg-surface-800 rounded-xl p-3 text-center shadow-sm border border-surface-50 dark:border-surface-700/50">
            <div className="flex items-center justify-center gap-1 text-surface-600 dark:text-surface-300 mb-0.5">
              <GraduationCap size={13} />
            </div>
            <div className="text-[16px] font-extrabold text-surface-900 dark:text-surface-100">
              {classSubjects.length}
            </div>
            <div className="text-[9px] text-surface-400 font-medium uppercase tracking-wider">{t('teacher.assignedClasses.subjects')}</div>
          </div>
          <div className="bg-white dark:bg-surface-800 rounded-xl p-3 text-center shadow-sm border border-surface-50 dark:border-surface-700/50">
            <div className="flex items-center justify-center gap-1 text-surface-600 dark:text-surface-300 mb-0.5">
              <ClipboardCheck size={13} />
            </div>
            <div className="text-[16px] font-extrabold" style={{ color: colors.badge }}>
              {capacity}
            </div>
            <div className="text-[9px] text-surface-400 font-medium uppercase tracking-wider">{t('teacher.assignedClasses.capacity')}</div>
          </div>
        </div>

        {/* Subjects list */}
        {classSubjects.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-400 mb-2">
              {t('teacher.assignedClasses.subjectsTaught')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {classSubjects.slice(0, 5).map((s) => (
                <span
                  key={s.id || s.subjectId}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold"
                  style={{ background: colors.bg, color: colors.badge }}
                >
                  {s.name || s.subjectName}
                </span>
              ))}
              {classSubjects.length > 5 && (
                <span className="text-[11px] text-surface-400 font-medium px-2 py-1">
                  +{classSubjects.length - 5} {t('teacher.assignedClasses.more')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Capacity bar */}
        {capacity > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-[10px] text-surface-400 mb-1.5">
              <span>{t('teacher.assignedClasses.occupancy')}</span>
              <span className="font-semibold">{occupancyPct}%</span>
            </div>
            <div className="h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${occupancyPct}%`,
                  background: `linear-gradient(90deg, ${colors.badge}, ${colors.badge}cc)`,
                }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => onViewStudents?.(cls)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-surface-50 dark:bg-surface-900 text-surface-600 dark:text-surface-300 text-[11px] font-semibold hover:bg-surface-100 dark:hover:bg-surface-700 transition-all hover:-translate-y-0.5"
          >
            <Eye size={12} />
            {t('teacher.myClasses.viewStudents')}
          </button>
          <button
            onClick={() => navigate(`/dashboard/classes/${cls.id}`)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-surface-50 dark:bg-surface-900 text-surface-600 dark:text-surface-300 text-[11px] font-semibold hover:bg-surface-100 dark:hover:bg-surface-700 transition-all hover:-translate-y-0.5"
          >
            <TrendingUp size={12} />
            {t('teacher.assignedClasses.details')}
          </button>
          <button
            onClick={() => onTakeAttendance?.(cls)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg font-semibold text-[11px] text-white transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{ background: colors.badge }}
          >
            <ClipboardCheck size={12} />
            {t('teacher.assignedClasses.attendance')}
          </button>
        </div>
      </div>

      {/* ── Hover shimmer overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{ opacity: isHovered ? 1 : 0 }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent" />
      </div>
    </div>
  );
}

// ── Student Row ──
function StudentRow({ student }) {
  const name = student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim();
  const avColors = getAvatarColors(name);
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-900/50 transition-colors group">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold flex-shrink-0"
        style={{ background: avColors.bg, color: avColors.text }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-surface-900 dark:text-surface-100 truncate">
          {name}
        </div>
        <div className="text-[11px] text-surface-400">
          {student.studentNumber || student.className || ''}
        </div>
      </div>
    </div>
  );
}

// ── Student List Modal ──
function StudentListModal({ cls, students, loading, pc, onClose }) {
  const { t } = useTranslation('common');
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = students.filter((s) => {
    const name = (s.fullName || `${s.firstName || ''} ${s.lastName || ''}`).toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-surface-800 rounded-2xl shadow-2xl border border-surface-100 dark:border-surface-700 w-full max-w-lg max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'tacFadeUp 0.35s cubic-bezier(.16,1,.3,1) both' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-100 dark:border-surface-700">
          <div>
            <h2 className="text-[16px] font-bold text-surface-900 dark:text-surface-100">
              {cls?.name}
            </h2>
            <p className="text-[12px] text-surface-400 mt-0.5">
              {students.length} {students.length <= 1 ? t('teacher.myClasses.student_one') : t('teacher.myClasses.student_other')} {t('teacher.myClasses.enrolled')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-surface-400 hover:text-surface-600 transition-colors"
          >
            <XCircle size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-3 pb-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('teacher.myClasses.searchStudents')}
              className="w-full h-9 pl-9 pr-3 bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-700 rounded-lg text-[13px] text-surface-800 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:border-primary-400 transition-colors"
            />
          </div>
        </div>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-12 bg-surface-50 dark:bg-surface-900 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users size={24} className="text-surface-300 mb-2" />
              <p className="text-sm text-surface-400">
                {searchTerm
                  ? t('teacher.myClasses.noSearchResults')
                  : t('teacher.myClasses.noStudentsInClass')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-surface-50 dark:divide-surface-700/50">
              {filtered.map((student) => (
                <StudentRow key={student.id} student={student} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──
export default function TeacherAssignedClasses({
  teacherId,
  classes = [],
  subjects = [],
  primaryColor = '#085041',
  loading = false,
  onTakeAttendance,
}) {
  const { t, i18n } = useTranslation('common');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  // Determine which classes the teacher is the main teacher for
  // Uses classTeacherId directly from the class data (returned by getTeacherClasses endpoint)
  const mainClassIds = useMemo(() => {
    if (!teacherId) return new Set();
    return new Set(
      classes
        .filter((c) => String(c.classTeacherId) === String(teacherId))
        .map((c) => c.id)
    );
  }, [classes, teacherId]);

  const filteredClasses = classes.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase())
  );

  // ── Styles ──
  const animStyles = `
    @keyframes tacFadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes tacScaleIn {
      from { opacity: 0; transform: scale(0.9); }
      to   { opacity: 1; transform: scale(1); }
    }
  `;

  // ── Student Modal State ──
  const [studentModal, setStudentModal] = useState({
    open: false,
    cls: null,
    students: [],
    loadingStudents: false,
  });

  // ── View Students Handler ──
  const handleViewStudents = useCallback(async (cls) => {
    setStudentModal({ open: true, cls, students: [], loadingStudents: true });
    try {
      const data = await getEnrollments({
        classId: cls.id,
        status: 'active',
        limit: 200,
      });
      const enrollments = data?.enrollments || [];
      const students = enrollments.map((e) => ({
        id: e.studentId,
        fullName: e.studentName,
        classId: e.classId,
        className: e.className,
      }));
      setStudentModal((prev) => ({ ...prev, students, loadingStudents: false }));
    } catch (err) {
      console.error('Failed to load students:', err);
      setStudentModal((prev) => ({ ...prev, loadingStudents: false }));
    }
  }, []);

  const classCount = classes.length;
  const classLabel = classCount <= 1
    ? t('teacher.assignedClasses.class_one')
    : t('teacher.assignedClasses.class_other');

  if (loading) {
    return (
      <>
        <style>{animStyles}</style>
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-1 h-6 rounded" style={{ background: primaryColor }} />
            <h2 className="text-[16px] font-bold text-surface-900 dark:text-surface-100">
              {t('teacher.assignedClasses.title')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 overflow-hidden animate-pulse"
              >
                <div className="h-28 bg-surface-100 dark:bg-surface-700" />
                <div className="p-5 space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="h-16 bg-surface-50 dark:bg-surface-900 rounded-xl" />
                    ))}
                  </div>
                  <div className="h-4 w-24 bg-surface-50 dark:bg-surface-900 rounded" />
                  <div className="h-9 bg-surface-50 dark:bg-surface-900 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (!loading && classes.length === 0) {
    return (
      <>
        <style>{animStyles}</style>
        <div className="space-y-4" style={{ animation: 'tacFadeUp 0.5s cubic-bezier(.16,1,.3,1) both' }}>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-1 h-6 rounded" style={{ background: primaryColor }} />
            <h2 className="text-[16px] font-bold text-surface-900 dark:text-surface-100">
              {t('teacher.assignedClasses.title')}
            </h2>
          </div>
          <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-dashed border-surface-200 dark:border-surface-700">
            <div className="w-16 h-16 rounded-full bg-surface-50 dark:bg-surface-800 flex items-center justify-center mb-4 border-2 border-dashed border-surface-200 dark:border-surface-600">
              <BookOpen size={28} className="text-surface-300 dark:text-surface-500" />
            </div>
            <h3 className="text-[16px] font-semibold text-surface-700 dark:text-surface-200 mb-1">
              {t('teacher.assignedClasses.noClasses')}
            </h3>
            <p className="text-[13px] text-surface-400 max-w-sm">
              {t('teacher.assignedClasses.noClassesDesc')}
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{animStyles}</style>

      <div className="space-y-4">
        {/* ── Section header ── */}
        <div
          className="flex items-center justify-between flex-wrap gap-3"
          style={{ animation: 'tacFadeUp 0.5s cubic-bezier(.16,1,.3,1) both' }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-6 rounded" style={{ background: primaryColor }} />
            <h2 className="text-[16px] font-bold text-surface-900 dark:text-surface-100">
              {t('teacher.assignedClasses.title')}
            </h2>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: `${primaryColor}12`,
                color: primaryColor,
              }}
            >
              {classCount} {classLabel}
            </span>
          </div>

          <button
            onClick={() => navigate('/dashboard/my-classes')}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold transition-all hover:gap-2"
            style={{ color: primaryColor }}
          >
            {t('teacher.assignedClasses.viewAll')} <ArrowRight size={13} />
          </button>
        </div>

        {/* ── Search bar ── */}
        {classes.length > 0 && (
          <div
            className="relative max-w-xs"
            style={{ animation: 'tacFadeUp 0.5s 0.06s cubic-bezier(.16,1,.3,1) both' }}
          >
            <BookOpen
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('teacher.assignedClasses.search')}
              className="w-full h-9 pl-9 pr-3 bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-xl text-[12px] text-surface-800 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:border-primary-400 transition-colors"
            />
          </div>
        )}

        {/* ── Quick stats strip ── */}
        {classes.length > 0 && (
          <div
            className="flex flex-wrap gap-3"
            style={{ animation: 'tacFadeUp 0.5s 0.1s cubic-bezier(.16,1,.3,1) both' }}
          >
            {[
              {
                icon: Users,
                value: classes.reduce((s, c) => s + (c.studentCount || 0), 0),
                label: t('teacher.assignedClasses.totalStudentsLabel'),
                color: '#3B82F6',
              },
              {
                icon: GraduationCap,
                value: classes.reduce(
                  (s, c) =>
                    s +
                    subjects.filter((sub) => String(sub.classId) === String(c.id)).length,
                  0
                ),
                label: t('teacher.assignedClasses.subjectsTaught'),
                color: '#8B5CF6',
              },
              {
                icon: Star,
                value: mainClassIds.size,
                label: t('teacher.assignedClasses.asMainTeacher'),
                color: '#F59E0B',
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-surface-800 rounded-xl border-[1.5px] border-surface-100 dark:border-surface-700 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${stat.color}12` }}
                >
                  <stat.icon size={13} style={{ color: stat.color }} />
                </div>
                <div>
                  <span
                    className="text-[14px] font-extrabold"
                    style={{ color: '#1A1F1B' }}
                  >
                    {stat.value}
                  </span>
                  <span className="text-[10px] text-surface-400 ml-1.5 font-medium">
                    {stat.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Class cards grid ── */}
        {filteredClasses.length === 0 && search ? (
          <div
            className="flex flex-col items-center justify-center py-10 text-center bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700"
            style={{ animation: 'tacScaleIn 0.4s cubic-bezier(.16,1,.3,1) both' }}
          >
            <BookOpen size={24} className="text-surface-300 mb-2" />
            <p className="text-[13px] text-surface-400">{t('teacher.assignedClasses.noSearchResults')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredClasses.map((cls, idx) => (
              <ClassCard
                key={cls.id}
                cls={cls}
                subjects={subjects}
                isMainTeacher={mainClassIds.has(cls.id)}
                index={idx}
                onTakeAttendance={onTakeAttendance}
                onViewStudents={handleViewStudents}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Student List Modal ── */}
      {studentModal.open && (
        <StudentListModal
          cls={studentModal.cls}
          students={studentModal.students}
          loading={studentModal.loadingStudents}
          pc={primaryColor}
          onClose={() =>
            setStudentModal({
              open: false,
              cls: null,
              students: [],
              loadingStudents: false,
            })
          }
        />
      )}
    </>
  );
}
