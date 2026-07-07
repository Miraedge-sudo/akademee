const sql = require('../config/database');

class ReportService {
  async generateBulletin(schoolId, studentId, periodId) {
    const student = await sql`
      SELECT st.*, CONCAT(u.first_name, ' ', u.last_name) AS student_name, u.email
      FROM students st
      JOIN users u ON st.user_id = u.user_id
      WHERE st.student_id = ${studentId} AND st.school_id = ${schoolId}
    `;
    if (student.length === 0) throw new Error('Student not found');

    const school = await sql`
      SELECT name, subdomain, logo_url, primary_color, city, region
      FROM schools WHERE school_id = ${schoolId}
    `;

    const grades = await sql`
      SELECT g.*, s.name AS subject_name, s.coefficient
      FROM grades g
      JOIN subjects s ON g.subject_id = s.subject_id
      WHERE g.student_id = ${studentId} AND g.school_id = ${schoolId}
        ${periodId ? sql`AND g.period_id = ${periodId}` : sql``}
      ORDER BY s.name ASC
    `;

    const totalScore = grades.reduce((sum, g) => sum + Number(g.score) * Number(g.coefficient), 0);
    const totalCoefficients = grades.reduce((sum, g) => sum + Number(g.coefficient), 0);
    const average = totalCoefficients > 0 ? (totalScore / totalCoefficients).toFixed(2) : '0.00';

    return {
      student: {
        id: student[0].student_id,
        name: student[0].student_name,
        email: student[0].email,
        classLabel: student[0].class_label,
        studentNumber: student[0].student_number,
      },
      school: school[0] ? {
        name: school[0].name,
        subdomain: school[0].subdomain,
        logoUrl: school[0].logo_url,
        primaryColor: school[0].primary_color,
      } : null,
      periodId,
      grades: grades.map(g => ({
        subject: g.subject_name,
        score: Number(g.score),
        coefficient: Number(g.coefficient),
        weightedScore: Number(g.score) * Number(g.coefficient),
      })),
      summary: {
        totalSubjects: grades.length,
        totalScore,
        totalCoefficients,
        average: Number(average),
      },
    };
  }

  async generateClassReport(schoolId, classId, periodId) {
    const classInfo = await sql`
      SELECT * FROM classes WHERE class_id = ${classId} AND school_id = ${schoolId}
    `;
    if (classInfo.length === 0) throw new Error('Class not found');

    const students = await sql`
      SELECT st.student_id, st.student_number, st.class_label,
        CONCAT(u.first_name, ' ', u.last_name) AS student_name, u.email
      FROM enrollments e
      JOIN students st ON e.student_id = st.student_id
      JOIN users u ON st.user_id = u.user_id
      WHERE e.class_id = ${classId} AND e.school_id = ${schoolId} AND e.status = 'active'
      ORDER BY u.first_name ASC
    `;

    if (students.length === 0) {
      return {
        class: classInfo[0],
        students: [],
        summary: { totalStudents: 0, classAverage: 0, periodId },
      };
    }

    const schoolInfo = await sql`
      SELECT name, subdomain, logo_url, primary_color, city, region
      FROM schools WHERE school_id = ${schoolId}
    `;

    const allGrades = await sql`
      SELECT g.student_id, g.score, g.period_id, g.created_at,
        s.name AS subject_name, s.coefficient
      FROM grades g
      JOIN subjects s ON g.subject_id = s.subject_id
      WHERE g.student_id = ANY(${students.map(s => s.student_id)})
        AND g.school_id = ${schoolId}
        ${periodId ? sql`AND g.period_id = ${periodId}` : sql``}
      ORDER BY s.name ASC
    `;

    const gradesByStudent = {};
    for (const g of allGrades) {
      if (!gradesByStudent[g.student_id]) gradesByStudent[g.student_id] = [];
      gradesByStudent[g.student_id].push(g);
    }

    const studentReports = students.map(student => {
      const grades = gradesByStudent[student.student_id] || [];
      const totalScore = grades.reduce((sum, g) => sum + Number(g.score) * Number(g.coefficient), 0);
      const totalCoefficients = grades.reduce((sum, g) => sum + Number(g.coefficient), 0);
      const average = totalCoefficients > 0 ? (totalScore / totalCoefficients).toFixed(2) : '0.00';

      return {
        student: {
          id: student.student_id,
          name: student.student_name,
          email: student.email,
          classLabel: student.class_label,
          studentNumber: student.student_number,
        },
        school: schoolInfo[0] ? {
          name: schoolInfo[0].name,
          subdomain: schoolInfo[0].subdomain,
          logoUrl: schoolInfo[0].logo_url,
          primaryColor: schoolInfo[0].primary_color,
        } : null,
        periodId,
        grades: grades.map(g => ({
          subject: g.subject_name,
          score: Number(g.score),
          coefficient: Number(g.coefficient),
          weightedScore: Number(g.score) * Number(g.coefficient),
        })),
        summary: {
          totalSubjects: grades.length,
          totalScore,
          totalCoefficients,
          average: Number(average),
        },
      };
    });

    const classAverage = studentReports.length > 0
      ? studentReports.reduce((sum, r) => sum + r.summary.average, 0) / studentReports.length
      : 0;

    return {
      class: classInfo[0],
      students: studentReports,
      summary: {
        totalStudents: studentReports.length,
        classAverage: Number(classAverage.toFixed(2)),
        periodId,
      },
    };
  }

  async getStudentPerformance(schoolId, studentId) {
    const grades = await sql`
      SELECT g.*, s.name AS subject_name, s.coefficient
      FROM grades g
      JOIN subjects s ON g.subject_id = s.subject_id
      WHERE g.student_id = ${studentId} AND g.school_id = ${schoolId}
      ORDER BY g.created_at DESC
    `;

    const attendance = await sql`
      SELECT status, COUNT(*)::int AS count
      FROM attendance
      WHERE student_id = ${studentId} AND school_id = ${schoolId}
      GROUP BY status
    `;

    const bySubject = {};
    for (const g of grades) {
      if (!bySubject[g.subject_name]) {
        bySubject[g.subject_name] = { subject: g.subject_name, scores: [], average: 0 };
      }
      bySubject[g.subject_name].scores.push(Number(g.score));
      const scores = bySubject[g.subject_name].scores;
      bySubject[g.subject_name].average = scores.reduce((a, b) => a + b, 0) / scores.length;
    }

    const overallGrades = grades.map(g => Number(g.score));
    const overallAverage = overallGrades.length > 0
      ? overallGrades.reduce((a, b) => a + b, 0) / overallGrades.length
      : 0;

    return {
      studentId,
      overallAverage: Number(overallAverage.toFixed(2)),
      totalGrades: grades.length,
      bySubject: Object.values(bySubject),
      attendance,
    };
  }

  async generateBulletinPdf(schoolId, studentId, periodId) {
    const PDFDocument = require('pdfkit');
    const data = await this.generateBulletin(schoolId, studentId, periodId);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const school = data.school || {};
        const student = data.student || {};
        const { summary = {}, grades = [] } = data;

        doc.fontSize(18).font('Helvetica-Bold').text(school.name || 'School', { align: 'center' });
        doc.fontSize(10).font('Helvetica').text('Report Card', { align: 'center' });
        doc.moveDown();

        doc.fontSize(11).font('Helvetica-Bold').text(`Student: ${student.name || 'N/A'}`);
        doc.fontSize(10).font('Helvetica').text(`Class: ${student.classLabel || 'N/A'}`);
        doc.text(`Student #: ${student.studentNumber || 'N/A'}`);
        doc.moveDown();

        doc.fontSize(11).font('Helvetica-Bold').text('Subjects & Grades', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const colX = { subject: 50, score: 250, coeff: 320, weighted: 400, letter: 470 };

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Subject', colX.subject, tableTop);
        doc.text('Score', colX.score, tableTop);
        doc.text('Coeff', colX.coeff, tableTop);
        doc.text('W.Score', colX.weighted, tableTop);
        doc.text('Grade', colX.letter, tableTop);
        doc.moveDown(0.5);

        let y = doc.y;
        doc.fontSize(9).font('Helvetica');
        for (const g of grades) {
          if (y > 700) { doc.addPage(); y = 50; }
          doc.text(g.subject || '', colX.subject, y);
          doc.text(String(g.score ?? ''), colX.score, y);
          doc.text(String(g.coefficient ?? ''), colX.coeff, y);
          doc.text(String(g.weightedScore ?? ''), colX.weighted, y);
          doc.text(g.letter || '', colX.letter, y);
          y += 18;
        }

        doc.moveDown();
        doc.fontSize(11).font('Helvetica-Bold');
        doc.text(`Total Score: ${summary.totalScore?.toFixed(2) || '0.00'}`);
        doc.text(`Average: ${summary.average || '0.00'}`);
        doc.text(`Total Subjects: ${summary.totalSubjects || 0}`);

        doc.moveDown(2);
        doc.fontSize(8).font('Helvetica').fillColor('#888');
        doc.text(`Generated on ${new Date().toLocaleDateString()} by Akademee`, { align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  async exportReport(schoolId, reportId, format = 'pdf') {
    return { reportId, format, url: null };
  }
}

module.exports = new ReportService();
