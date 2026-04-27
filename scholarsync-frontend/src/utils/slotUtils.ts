import { convertToUTC } from './timeUtils';

interface SlotTimes {
  date: string;
  startTime: string;
  endTime: string;
}

interface FormattedSlotTimes {
  date: Date | null;
  startTime: Date | null;
  endTime: Date | null;
}

interface SlotData {
  date: string | Date;
  startTime: string | Date;
  endTime: string | Date;
}

// Convert IST times to UTC before creating a slot
export const prepareSlotTimes = (date: Date | string, startTime: Date, endTime: Date): SlotTimes => {
  // Validate input dates
  if (!date || isNaN(new Date(date).getTime())) {
    throw new Error('Invalid date value');
  }
  if (!startTime || isNaN(startTime.getTime())) {
    throw new Error('Invalid start time value');
  }
  if (!endTime || isNaN(endTime.getTime())) {
    throw new Error('Invalid end time value');
  }

  // Convert date to UTC
  const utcDate = convertToUTC(date);

  // Convert times to UTC
  const utcStartTime = convertToUTC(new Date(date));
  if (utcStartTime) {
    utcStartTime.setHours(startTime.getHours(), startTime.getMinutes());
  }

  const utcEndTime = convertToUTC(new Date(date));
  if (utcEndTime) {
    utcEndTime.setHours(endTime.getHours(), endTime.getMinutes());
  }

  // Convert all dates back to ISO strings
  return {
    date: utcDate!.toISOString(),
    startTime: utcStartTime!.toISOString(),
    endTime: utcEndTime!.toISOString()
  };
};

// Convert UTC times back to IST for display
export const formatSlotTimes = (slot: SlotData | null): FormattedSlotTimes | null => {
  if (!slot) return null;

  const istDate = convertToUTC(slot.date);
  const istStartTime = convertToUTC(slot.startTime);
  const istEndTime = convertToUTC(slot.endTime);

  return {
    date: istDate,
    startTime: istStartTime,
    endTime: istEndTime
  };
};
