// Handle UTC dates directly for slot creation
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
  console.log('Input date:', date);
  console.log('Input start time:', startTime);
  console.log('Input end time:', endTime);

  // Create date objects with the provided times
  const dateObj = new Date(date);
  const startTimeObj = new Date(date);
  const endTimeObj = new Date(date);

  // Set the hours and minutes
  startTimeObj.setHours(startTime.getHours(), startTime.getMinutes());
  endTimeObj.setHours(endTime.getHours(), endTime.getMinutes());

  // Debug logging
  console.log('Date object:', dateObj);
  console.log('Start time object:', startTimeObj);
  console.log('End time object:', endTimeObj);

  // Convert to ISO strings (already in UTC)
  return {
    date: dateObj.toISOString(),
    startTime: startTimeObj.toISOString(),
    endTime: endTimeObj.toISOString()
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
