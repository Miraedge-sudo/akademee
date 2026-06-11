const PDFDocument = require('pdfkit');

exports.generateReportCard = (data = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      doc.fontSize(20).text('Report Card', { align: 'center' });
      doc.moveDown();
      
      if (data.student) {
        doc.fontSize(12).text(`Name: ${data.student.first_name} ${data.student.last_name}`);
        doc.text(`Student ID: ${data.student.student_id}`);
      } else {
        doc.fontSize(12).text(`Student ID: ${data.studentId || 'N/A'}`);
      }
      
      doc.moveDown();
      
      // Add grades if available
      if (data.grades && data.grades.length > 0) {
        doc.fontSize(14).text('Grades:');
        data.grades.forEach((grade) => {
          doc.fontSize(11).text(`${grade.subject}: ${grade.grade}`);
        });
      } else {
        doc.fontSize(12).text('No grades available.');
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
