export const calculateAttendancePercentage = (stats) => {
  return stats.total > 0
    ? Math.round((stats.present / (stats.total - stats.pending)) * 100)
    : 0;
};
