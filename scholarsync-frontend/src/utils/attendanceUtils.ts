interface AttendanceStats {
  total: number;
  present: number;
  pending: number;
}

export const calculateAttendancePercentage = (stats: AttendanceStats): number => {
  return stats.total > 0
    ? Math.round((stats.present / (stats.total - stats.pending)) * 100)
    : 0;
};
