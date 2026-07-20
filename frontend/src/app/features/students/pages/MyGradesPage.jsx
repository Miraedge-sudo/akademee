/**
 * MyGradesPage — Student grades overview page.
 *
 * Features:
 *  - Hero banner with student info
 *  - Subject averages with animated bars
 *  - Sequence performance chart
 *  - Detailed grade table per subject
 *  - Overall average and rank
 *
 * Route: /dashboard/my-grades
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/hooks/useAuth';
import { useTheme } from '../../../core/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { getStudentMe } from '../../../core/api/studentService';
import { getStudentAverages, getClassRankings } from '../../../core/api/gradeCalculationService';
import { getStudentGrades } from '../../../core/api/gradeService';
import SubjectGrades from '../components/SubjectGrades';
import SequencePerformance from '../components/SequencePerformance';
import {
  ArrowLeft,
  TrendingUp,
  Award,
  BookOpen,
  BarChart3,
  Medal,
  ClipboardList,
} from 'lucide-react';

function scoreColor(score) {
  const pct = (score / 20) * 100;
  if (pct >= 60) return '#1D9E75';
  if (pct >= 40) return '#F59E0B';
  return '#EF4444';
}

export default function MyGradesPage() {
  const { user } = useAuth();
  const { primaryColor } = useTheme();
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const pc = primaryColor || '#085041';
  const isFr = i18n.language === 'fr';

  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [averages, setAverages] = useState(null);
  const [rawGrades, setRawGrades] = useState([]);
  const [rankData, setRankData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const profile = await getStudentMe();
        setStudent(profile);
        const studentId = profile.id;
        const classId = profile.classId;

        const [avgRes, gradeRes, rankRes] = await Promise.all([
          getStudentAverages(studentId).catch(() => null),
          getStudentGrades(studentId).catch(() => []),
          classId ? getClassRankings(classId).catch(() => []) : [],
        ]);

        setAverages(avgRes);
        setRawGrades(Array.isArray(gradeRes) ? gradeRes : gradeRes?.grades || []);
        setRankData(Array.isArray(rankRes) ? rankRes : []);
      } catch (err) {
        console.error('Failed to load grades:', err);
        setError(isFr ? 'Échec du chargement des notes' : 'Failed to load grades');
      }
      setLoading(false);
    }
    load();
  }, []);

  const studentId = student?.id;
  const annualAvg = averages?.overallAverage || 0;
  const getMention = (avg) => {
    if (avg >= 16) return { label: isFr ? 'Très bien' : 'Very good', color: '#1D9E75' };
    if (avg >= 14) return { label: isFr ? 'Bien' : 'Good', color: '#3B82F6' };
    if (avg >= 12) return { label: isFr ? 'Assez bien' : 'Fairly good', color: '#8B5CF6' };
    if (avg >= 10) return { label: isFr ? 'Passable' : 'Passable', color: '#F59E0B' };
    return { label: isFr ? 'Insuffisant' : 'Insufficient', color: '#EF4444' };
  };
  const mention = getMention(annualAvg);
  const subjects = averages?.subjectAverages || [];
  const myRank = rankData.find(r => r.studentId === studentId);
  const rank = myRank?.rank || '-';
  const totalStudents = rankData.length || 0;

  // Group grades by subject
  const gradesBySubject = {};
  rawGrades.forEach(g => {
    const subj = g.subjectName || g.subject || 'Unknown';
    if (!gradesBySubject[subj]) gradesBySubject[subj] = [];
    gradesBySubject[subj].push(g);
  });

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-48 bg-surface-100 dark:bg-surface-800 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-72 bg-surface-100 dark:bg-surface-800 rounded-2xl" />
          <div className="h-72 bg-surface-100 dark:bg-surface-800 rounded-2xl" />
        </div>
        <div className="h-96 bg-surface-100 dark:bg-surface-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12 space-y-5">
      <style>{`
        @keyframes mgFadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .mg-fade { animation: mgFadeUp 0.5s cubic-bezier(.16,1,.3,1) both; }
      `}</style>

      {/* ── Header ── */}
      <div
        className="mg-fade relative overflow-hidden rounded-2xl p-6 sm:p-8 shadow-lg"
        style={{ background: `linear-gradient(135deg, ${pc}, ${pc}dd)` }}
      >
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/[0.03] rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="relative z-10">
          <button
            onClick={() => navigate('/dashboard/student-home')}
            className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-[12px] font-medium mb-3 transition-colors"
          >
            <ArrowLeft size={14} />
            {isFr ? 'Retour au tableau de bord' : 'Back to dashboard'}
          </button>
          <h1 className="font-display text-[clamp(22px,3vw,30px)] font-bold text-white leading-tight mb-2">
            {isFr ? 'Mes Notes' : 'My Grades'}
          </h1>
          <p className="text-white/70 text-sm max-w-lg">
            {student?.fullName}{student?.className ? ` · ${student.className}` : ''}
          </p>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="mg-fade grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ animationDelay: '0.06s' }}>
        {[
          { icon: Award, value: annualAvg.toFixed(1) + '/20', label: isFr ? 'Moyenne générale' : 'Overall Avg', color: mention.color },
          { icon: Medal, value: rank !== '-' ? `#${rank}` : '-', label: isFr ? 'Classement' : 'Rank', color: '#8B5CF6' },
          { icon: BookOpen, value: subjects.length, label: isFr ? 'Matières' : 'Subjects', color: '#3B82F6' },
          { icon: ClipboardList, value: rawGrades.length, label: isFr ? 'Notes saisies' : 'Grades recorded', color: '#1D9E75' },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-surface-800 rounded-xl border-[1.5px] border-surface-100 dark:border-surface-700 p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: `${stat.color}15` }}>
                <stat.icon size={16} style={{ color: stat.color }} />
              </div>
              <div>
                <div className="text-[18px] font-extrabold text-surface-900 dark:text-surface-100">{stat.value}</div>
                <div className="text-[11px] text-surface-400">{stat.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Mention banner ── */}
      {annualAvg > 0 && (
        <div
          className="mg-fade flex items-center gap-3 px-5 py-3.5 rounded-xl text-[13px] font-medium shadow-sm border"
          style={{
            background: `${mention.color}08`,
            borderColor: `${mention.color}20`,
            color: mention.color,
            animationDelay: '0.07s',
          }}
        >
          <TrendingUp size={18} />
          <span>
            {isFr ? 'Mention' : 'Honours'}: <strong>{mention.label}</strong>
            {' · '}
            {annualAvg.toFixed(2)}/20
            {totalStudents > 0 && rank !== '-' && (
              <span> · {isFr ? 'Rang' : 'Rank'}: {rank}/{totalStudents}</span>
            )}
          </span>
        </div>
      )}

      {/* ── Subject Averages + Sequence Performance ── */}
      <div className="mg-fade grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ animationDelay: '0.08s' }}>
        <SubjectGrades averages={averages} studentId={studentId} />
        <SequencePerformance studentId={studentId} />
      </div>

      {/* ── Detailed Grades Table ── */}
      {Object.keys(gradesBySubject).length > 0 && (
        <div className="mg-fade" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white dark:bg-surface-800 border-[1.5px] border-surface-100 dark:border-surface-700 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-surface-100 dark:border-surface-700">
              <BarChart3 size={16} className="text-surface-400" />
              <h3 className="text-[15px] font-bold text-surface-900 dark:text-surface-100">
                {isFr ? 'Détail des notes' : 'Grade Details'}
              </h3>
              <span className="text-[11px] text-surface-400 ml-auto">{rawGrades.length} {isFr ? 'notes' : 'grades'}</span>
            </div>

            <div className="divide-y divide-surface-50 dark:divide-surface-700/50">
              {Object.entries(gradesBySubject).map(([subject, grades], subjIdx) => (
                <div key={subject} className="mg-fade" style={{ animationDelay: `${0.12 + subjIdx * 0.04}s` }}>
                  <div className="px-5 py-3 bg-surface-50/50 dark:bg-surface-900/30">
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-surface-400" />
                      <span className="text-[13px] font-bold text-surface-700 dark:text-surface-200">{subject}</span>
                      <span className="text-[11px] text-surface-400 ml-auto">
                        {grades.length} {isFr ? 'note(s)' : 'grade(s)'}
                        {' · '}
                        {grades.some(g => g.periodName || g.periodId) ? (isFr ? 'Périodes' : 'Periods') : ''}
                      </span>
                    </div>
                  </div>
                  <div className="px-5 py-2 space-y-1">
                    {grades.map((g, idx) => {
                      const sc = g.score || 0;
                      const color = scoreColor(sc);
                      return (
                        <div
                          key={g.id || idx}
                          className="flex items-center gap-3 py-1.5"
                        >
                          <div className="flex-1 text-[12px] text-surface-500">
                            {g.periodName || g.periodId || `#${idx + 1}`}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[15px] font-extrabold tabular-nums" style={{ color }}>
                              {sc.toFixed(1)}
                            </span>
                            <span className="text-[11px] text-surface-400">/20</span>
                          </div>
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {Object.keys(gradesBySubject).length === 0 && !loading && (
        <div className="mg-fade flex flex-col items-center justify-center py-16 text-center" style={{ animationDelay: '0.1s' }}>
          <div className="w-20 h-20 rounded-2xl bg-surface-50 dark:bg-surface-800 flex items-center justify-center mb-5 border-2 border-dashed border-surface-200 dark:border-surface-600">
            <ClipboardList size={32} className="text-surface-300" />
          </div>
          <h3 className="text-lg font-semibold text-surface-700 dark:text-surface-200 mb-1.5">
            {isFr ? 'Aucune note pour le moment' : 'No grades yet'}
          </h3>
          <p className="text-sm text-surface-400 max-w-sm">
            {isFr
              ? 'Vos notes apparaîtront ici une fois que les enseignants les auront saisies.'
              : 'Your grades will appear here once your teachers have entered them.'}
          </p>
        </div>
      )}
    </div>
  );
}
