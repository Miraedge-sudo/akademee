const sql = require('../config/database');

class GradeCalculationService {
  async getGradeScale(schoolId, system = 'francophone') {
    const rows = await sql`
      SELECT * FROM grade_scales WHERE school_id = ${schoolId} AND system = ${system}
      ORDER BY min_score DESC
    `;
    if (rows.length === 0) {
      return [
        { letter: 'A', minScore: 16, maxScore: 20, gradePoint: 4.0 },
        { letter: 'B', minScore: 14, maxScore: 15.99, gradePoint: 3.5 },
        { letter: 'C', minScore: 12, maxScore: 13.99, gradePoint: 3.0 },
        { letter: 'D', minScore: 10, maxScore: 11.99, gradePoint: 2.5 },
        { letter: 'E', minScore: 8, maxScore: 9.99, gradePoint: 2.0 },
        { letter: 'F', minScore: 0, maxScore: 7.99, gradePoint: 1.0 },
      ];
    }
    return rows.map(r => ({
      letter: r.letter,
      minScore: Number(r.min_score),
      maxScore: Number(r.max_score),
      gradePoint: Number(r.grade_point),
    }));
  }

  scoreToLetter(score, scale) {
    for (const level of scale) {
      if (score >= level.minScore && score <= level.maxScore) return level;
    }
    return { letter: 'F', gradePoint: 0 };
  }

  async calculateStudentAverages(schoolId, studentId, academicSystem) {
    const grades = await sql`
      SELECT g.*, s.name AS subject_name, s.coefficient
      FROM grades g
      JOIN subjects s ON g.subject_id = s.subject_id
      WHERE g.student_id = ${studentId} AND g.school_id = ${schoolId}
    `;

    const scale = await this.getGradeScale(schoolId, academicSystem === 'TERM_SEQUENCE' ? 'francophone' : 'anglophone');

    const bySubject = {};
    for (const g of grades) {
      if (!bySubject[g.subject_name]) {
        bySubject[g.subject_name] = { subject: g.subject_name, coefficient: Number(g.coefficient), scores: [], totalWeighted: 0 };
      }
      bySubject[g.subject_name].scores.push(Number(g.score));
    }

    const subjectAverages = Object.values(bySubject).map(s => {
      const avg = s.scores.reduce((a, b) => a + b, 0) / s.scores.length;
      const letter = this.scoreToLetter(avg, scale);
      return {
        subject: s.subject,
        coefficient: s.coefficient,
        average: Number(avg.toFixed(2)),
        letter: letter.letter,
        gradePoint: letter.gradePoint,
        weightedScore: avg * s.coefficient,
      };
    });

    const totalWeighted = subjectAverages.reduce((sum, s) => sum + s.weightedScore, 0);
    const totalCoefficients = subjectAverages.reduce((sum, s) => sum + s.coefficient, 0);
    const overallAverage = totalCoefficients > 0 ? totalWeighted / totalCoefficients : 0;
    const overallLetter = this.scoreToLetter(overallAverage, scale);

    return {
      subjectAverages,
      totalWeighted,
      totalCoefficients,
      overallAverage: Number(overallAverage.toFixed(2)),
      overallLetter: overallLetter.letter,
      overallGradePoint: overallLetter.gradePoint,
    };
  }

  async calculateClassRankings(schoolId, classId, periodId) {
    const students = await sql`
      SELECT DISTINCT st.student_id, CONCAT(u.first_name, ' ', u.last_name) AS student_name
      FROM enrollments e
      JOIN students st ON e.student_id = st.student_id
      JOIN users u ON st.user_id = u.user_id
      WHERE e.class_id = ${classId} AND e.school_id = ${schoolId} AND e.status = 'active'
    `;

    if (students.length === 0) return [];

    const school = await sql`SELECT academic_system FROM schools WHERE school_id = ${schoolId}`;
    const system = school[0]?.academic_system || 'TERM_SEQUENCE';
    const scale = await this.getGradeScale(schoolId, system === 'TERM_SEQUENCE' ? 'francophone' : 'anglophone');
    const studentIds = students.map(s => s.student_id);

    const allGrades = await sql`
      SELECT g.*, s.name AS subject_name, s.coefficient
      FROM grades g
      JOIN subjects s ON g.subject_id = s.subject_id
      WHERE g.student_id = ANY(${studentIds}) AND g.school_id = ${schoolId}
    `;

    const gradesByStudent = {};
    for (const g of allGrades) {
      if (!gradesByStudent[g.student_id]) gradesByStudent[g.student_id] = [];
      gradesByStudent[g.student_id].push(g);
    }

    const results = students.map(student => {
      const studentGrades = gradesByStudent[student.student_id] || [];
      const bySubject = {};
      for (const g of studentGrades) {
        if (!bySubject[g.subject_name]) {
          bySubject[g.subject_name] = { subject: g.subject_name, coefficient: Number(g.coefficient), scores: [] };
        }
        bySubject[g.subject_name].scores.push(Number(g.score));
      }

      const subjectAverages = Object.values(bySubject).map(s => {
        const avg = s.scores.reduce((a, b) => a + b, 0) / s.scores.length;
        const letter = this.scoreToLetter(avg, scale);
        return {
          subject: s.subject,
          coefficient: s.coefficient,
          average: Number(avg.toFixed(2)),
          letter: letter.letter,
          gradePoint: letter.gradePoint,
          weightedScore: avg * s.coefficient,
        };
      });

      const totalWeighted = subjectAverages.reduce((sum, s) => sum + s.weightedScore, 0);
      const totalCoefficients = subjectAverages.reduce((sum, s) => sum + s.coefficient, 0);
      const overallAverage = totalCoefficients > 0 ? totalWeighted / totalCoefficients : 0;
      const overallLetter = this.scoreToLetter(overallAverage, scale);

      return {
        studentId: student.student_id,
        studentName: student.student_name,
        average: Number(overallAverage.toFixed(2)),
        gradePoint: overallLetter.gradePoint,
        letter: overallLetter.letter,
      };
    });

    results.sort((a, b) => b.average - a.average);
    results.forEach((r, i) => { r.rank = i + 1; });

    return results;
  }
}

module.exports = new GradeCalculationService();
