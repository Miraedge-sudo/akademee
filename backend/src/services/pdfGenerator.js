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
      doc.fontSize(12).text(`Student ID: ${data.studentId || 'N/A'}`);
      doc.moveDown();
      doc.text('This is a scaffold PDF. Replace with real data.');

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
