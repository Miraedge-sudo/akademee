const pdfService = require('../services/pdfGenerator');
const { Student, Grade } = require('../models');

exports.generatePdf = async (req, res) => {
  const studentId = req.params.studentId;
  
  // Fetch student and grades from PostgreSQL
  const students = await Student.findById(studentId);
  const student = students[0];
  
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }
  
  const grades = await Grade.findByStudent(studentId);
  
  const buffer = await pdfService.generateReportCard({ 
    studentId, 
    student,
    grades 
  });
  
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');
  res.send(buffer);
};
