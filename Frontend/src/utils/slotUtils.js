import { convertToUTC } from './timeUtils';

// Convert IST times to UTC before creating a slot
export const prepareSlotTimes = (date, startTime, endTime) => {
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

  // Debug logging
  //console.log('Input date:', date);
  //console.log('Input start time:', startTime);
  //console.log('Input end time:', endTime);

  // Convert date to UTC
  const utcDate = convertToUTC(date);
  
  // Convert times to UTC
  const utcStartTime = convertToUTC(new Date(date));
  utcStartTime.setHours(startTime.getHours(), startTime.getMinutes());
  
  const utcEndTime = convertToUTC(new Date(date));
  utcEndTime.setHours(endTime.getHours(), endTime.getMinutes());

  // Debug logging
  //console.log('UTC date:', utcDate);
  //console.log('UTC start time:', utcStartTime);
  //console.log('UTC end time:', utcEndTime);

  // Convert all dates back to ISO strings
  return {
    date: utcDate.toISOString(),
    startTime: utcStartTime.toISOString(),
    endTime: utcEndTime.toISOString()
  };
}

// Convert UTC times back to IST for display
export const formatSlotTimes = (slot) => {
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
