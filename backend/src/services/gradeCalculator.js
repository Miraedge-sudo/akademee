// Simple anglophone average calculator scaffold
exports.calculateAverage = (grades = []) => {
  if (!grades.length) return 0;
  const sum = grades.reduce((s, g) => s + (g.score || 0), 0);
  return sum / grades.length;
};
