import { sendResponse, STATUS_CODE } from 'scholarsync-backend-common';
import reportService from '../service/report-service.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isValidUUID = (id) => UUID_REGEX.test(id);

/**
 * Builds a date range from query parameters.
 * Ensures the filter never goes before the student's createdAt date.
 * Returns { startDate, endDate, filterDescription } or { error }.
 */
const buildDateFilter = (params, studentCreatedAt) => {
  const { year, month, date, startDate, endDate } = params;
  let filterStartDate;
  let filterEndDate;
  let filterDescription = 'All time';

  if (date) {
    const specificDate = new Date(date);
    if (isNaN(specificDate.getTime())) {
      return { startDate: null, endDate: null, filterDescription: null, error: 'Invalid date format. Please provide valid date in YYYY-MM-DD format' };
    }
    const startOfDay = new Date(specificDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(specificDate);
    endOfDay.setHours(23, 59, 59, 999);
    filterStartDate = new Date(Math.max(startOfDay, new Date(studentCreatedAt)));
    filterEndDate = endOfDay;
    filterDescription = `Date: ${specificDate.toDateString()}`;
  } else if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { startDate: null, endDate: null, filterDescription: null, error: 'Invalid date format. Please provide valid dates in YYYY-MM-DD format' };
    }
    filterStartDate = new Date(Math.max(start, new Date(studentCreatedAt)));
    filterEndDate = end;
    filterDescription = `${start.toDateString()} to ${end.toDateString()}`;
  } else if (year && month) {
    const parsedMonth = parseInt(month);
    const parsedYear = parseInt(year);
    if (isNaN(parsedMonth) || isNaN(parsedYear) ||
        parsedMonth < 1 || parsedMonth > 12 ||
        parsedYear < 2000 || parsedYear > 2100) {
      return { startDate: null, endDate: null, filterDescription: null, error: 'Invalid month or year values' };
    }
    const startOfMonth = new Date(parsedYear, parsedMonth - 1, 1);
    const endOfMonth = new Date(parsedYear, parsedMonth, 0, 23, 59, 59, 999);
    filterStartDate = new Date(Math.max(startOfMonth, new Date(studentCreatedAt)));
    filterEndDate = endOfMonth;
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    filterDescription = `${monthNames[parsedMonth - 1]} ${parsedYear}`;
  } else if (year) {
    const parsedYear = parseInt(year);
    if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      return { startDate: null, endDate: null, filterDescription: null, error: 'Invalid year value' };
    }
    const startOfYear = new Date(parsedYear, 0, 1);
    const endOfYear = new Date(parsedYear, 11, 31, 23, 59, 59, 999);
    filterStartDate = new Date(Math.max(startOfYear, new Date(studentCreatedAt)));
    filterEndDate = endOfYear;
    filterDescription = `Year ${parsedYear}`;
  } else {
    filterStartDate = new Date(studentCreatedAt);
    filterEndDate = new Date();
    filterDescription = `All time since ${new Date(studentCreatedAt).toDateString()}`;
  }

  return { startDate: filterStartDate, endDate: filterEndDate, filterDescription };
};

/**
 * Get student details with attendance records and stats.
 */
const getStudentDetailsWithAttendance = async (studentId, filterParams) => {
  if (!isValidUUID(studentId)) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1536' }, 'getStudentDetailsWithAttendance');
  }

  const student = await reportService.getStudentWithLectures(studentId);
  if (!student) {
    return sendResponse(STATUS_CODE.NOTFOUND, { code: '1117' }, 'getStudentDetailsWithAttendance');
  }

  // Lectures are stored as UUID ARRAY on the Student model
  const studentLectureIds = student.lectures || [];

  const { startDate, endDate, filterDescription, error } = buildDateFilter(filterParams, student.created_at);
  if (error) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { message: error }, 'getStudentDetailsWithAttendance');
  }

  const attendanceRecords = await reportService.getAttendanceRecords(studentId, studentLectureIds, { startDate, endDate });

  const pendingSlots = attendanceRecords.filter(r => r.status === 'pending').length;
  const awaitingSlots = attendanceRecords.filter(r => r.status === 'awaiting_approval').length;
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  const totalSlots = attendanceRecords.length;

  const attendanceStats = {
    totalSlots,
    pendingSlots,
    awaitingSlots,
    present: presentCount,
    absent: absentCount,
    attendancePercentage: totalSlots > 0 ? Math.round((presentCount / totalSlots) * 100) : 0
  };

  const formattedAttendance = attendanceRecords.map(record => ({
    ...record,
    slot: {
      shift: record.slotShift,
      startTime: record.slotStartTime,
      endTime: record.slotEndTime,
      date: record.slotDate
    }
  }));

  const counts = {
    totalSlots,
    pendingSlots,
    awaitingSlots,
    present: presentCount,
    absent: absentCount,
    totalRecords: attendanceRecords.length,
    attendancePercentage: totalSlots > 0 ? Math.round((presentCount / totalSlots) * 100) : 0
  };

  return sendResponse(STATUS_CODE.SUCCESS, {
    code: '5801',
    result: {
      student,
      filter: {
        year: filterParams.year || null,
        month: filterParams.month || null,
        date: filterParams.date || null,
        startDate: filterParams.startDate || null,
        endDate: filterParams.endDate || null,
        description: filterDescription
      },
      attendance: {
        records: formattedAttendance,
        stats: attendanceStats,
        totalRecords: attendanceRecords.length
      },
      counts
    }
  }, 'getStudentDetailsWithAttendance');
};

/**
 * Get monthly attendance details using aggregation.
 */
const getAttendanceDetails = async (studentId, month, year) => {
  if (!studentId || !month || !year) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1515' }, 'getAttendanceDetails');
  }

  if (!isValidUUID(studentId)) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1536' }, 'getAttendanceDetails');
  }

  const student = await reportService.getStudentWithLectures(studentId);
  if (!student) {
    return sendResponse(STATUS_CODE.NOTFOUND, { code: '1117' }, 'getAttendanceDetails');
  }

  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1516' }, 'getAttendanceDetails');
  }

  const startDate = new Date(yearNum, monthNum - 1, 1);
  const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);

  const adjustedStartDate = new Date(Math.max(startDate, new Date(student.created_at)));

  const attendanceRecords = await reportService.getAttendanceAggregation(studentId, adjustedStartDate, endDate);

  let present = 0;
  let absent = 0;

  attendanceRecords.forEach((record) => {
    if (record.status === 'present' && ['active', 'closed'].includes(record.slotStatus)) {
      present++;
    } else if (record.status === 'absent' && record.slotStatus === 'closed') {
      absent++;
    }
  });

  return sendResponse(STATUS_CODE.SUCCESS, {
    code: '5801',
    result: {
      student,
      attendance: {
        records: attendanceRecords,
        stats: {
          total: present + absent,
          present,
          absent,
        },
        totalRecords: attendanceRecords.length,
      },
    }
  }, 'getAttendanceDetails');
};

/**
 * Get overall attendance stats for all students in a date range.
 */
const getAttendanceStats = async (query) => {
  const { month, year, minAbsences, startDate: startDateParam, endDate: endDateParam } = query;

  let startDate, endDate;

  if (startDateParam && endDateParam) {
    startDate = new Date(startDateParam);
    endDate = new Date(endDateParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1526' }, 'getAttendanceStats');
    }
  } else if (month && year) {
    const parsedMonth = parseInt(month);
    const parsedYear = parseInt(year);

    if (isNaN(parsedMonth) || isNaN(parsedYear) ||
      parsedMonth < 1 || parsedMonth > 12 ||
      parsedYear < 2000 || parsedYear > 2100) {
      return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1514' }, 'getAttendanceStats');
    }

    startDate = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1));
    endDate = new Date(Date.UTC(parsedYear, parsedMonth, 0, 23, 59, 59, 999));
  } else {
    return sendResponse(STATUS_CODE.BAD_REQUEST, { code: '1527' }, 'getAttendanceStats');
  }

  const parsedMinAbsences = parseInt(minAbsences) || 0;

  const { allStudents, slots, attendanceRecords } = await reportService.getAttendanceStatsData({ startDate, endDate });

  const studentAttendance = new Map();

  allStudents.forEach(student => {
    const studentJoinDate = new Date(student.created_at);
    const studentLectureIds = student.lectures || [];

    studentAttendance.set(student.id, {
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        studentCode: student.studentCode || student.student_code
      },
      joinDate: studentJoinDate,
      lectureIds: studentLectureIds,
      present: 0,
      absent: 0,
      attendanceDates: [],
      absentDates: []
    });
  });

  attendanceRecords.forEach(record => {
    const recordStudentId = record.studentId;
    if (studentAttendance.has(recordStudentId)) {
      const data = studentAttendance.get(recordStudentId);
      data.present += 1;
      data.attendanceDates.push({
        date: record.date,
        slot: record.slotId
      });
      studentAttendance.set(recordStudentId, data);
    }
  });

  studentAttendance.forEach((data, sid) => {
    const studentJoinDate = data.joinDate;
    const studentLectureIds = data.lectureIds;

    const totalAvailableSlots = slots.filter(slot => {
      const slotDate = new Date(slot.date);
      const slotLectureId = slot.lectureId || slot.lecture_id;
      return slotDate >= studentJoinDate && studentLectureIds.includes(slotLectureId);
    });

    const totalSlotsCount = totalAvailableSlots.length;

    const presentCount = attendanceRecords.filter(record =>
      record.studentId === sid &&
      new Date(record.date) >= studentJoinDate
    ).length;

    data.present = presentCount;
    data.absent = totalSlotsCount - presentCount;

    const presentDates = new Set(
      attendanceRecords
        .filter(r => r.studentId === sid)
        .map(r => new Date(r.date).toISOString())
    );

    data.absentDates = totalAvailableSlots
      .map(slot => new Date(slot.date).toISOString())
      .filter(dateStr => !presentDates.has(dateStr));

    studentAttendance.set(sid, data);
  });

  const studentsWithAbsences = Array.from(studentAttendance.values())
    .filter(data => data.absent >= parsedMinAbsences)
    .sort((a, b) => b.absent - a.absent);

  const stats = {
    totalSlots: slots.length,
    totalStudents: allStudents.length,
    attendanceRecords: attendanceRecords.length,
    studentsWithAbsences
  };

  return sendResponse(STATUS_CODE.SUCCESS, {
    code: '5801',
    result: {
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      stats
    }
  }, 'getAttendanceStats');
};

/**
 * Get leave statistics by status and type.
 */
const getLeaveStats = async () => {
  const { statusStats, typeStats } = await reportService.getLeaveStatsData();

  const formattedStats = {
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
    closed: 0,
    total: 0
  };

  statusStats.forEach(stat => {
    formattedStats[stat.status] = parseInt(stat.count);
    formattedStats.total += parseInt(stat.count);
  });

  const formattedTypeStats = {
    sick: 0,
    other: 0
  };

  typeStats.forEach(stat => {
    formattedTypeStats[stat.leaveType] = parseInt(stat.count);
  });

  return sendResponse(STATUS_CODE.SUCCESS, {
    code: '5801',
    result: {
      statusStats: formattedStats,
      typeStats: formattedTypeStats
    }
  }, 'getLeaveStats');
};

export default {
  buildDateFilter,
  getStudentDetailsWithAttendance,
  getAttendanceDetails,
  getAttendanceStats,
  getLeaveStats
};
