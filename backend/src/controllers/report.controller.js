const pdfService = require('../services/pdfGenerator');

exports.generatePdf = async (req, res) => {
  const studentId = req.params.studentId;
  // For scaffold: return a tiny PDF buffer
  const buffer = await pdfService.generateReportCard({ studentId });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');
  res.send(buffer);
};
