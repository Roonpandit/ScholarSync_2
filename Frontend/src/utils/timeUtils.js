// FORMAT date as "Mon, May 1" (or similar)
export const formatDateDisplay = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
};

// FORMAT time as 24-hour IST, e.g. "14:05"
export const formatTime24h = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  });
};

// FORMAT date and time as "Mon, May 1 - 14:05"
export const formatDateTime = (date) => {
  if (!date) return "";
  const formattedDate = formatDateDisplay(date);
  const formattedTime = formatTime24h(date);
  return `${formattedDate} - ${formattedTime}`;
};

// CONVERT to IST Date object
export const convertToIST = (date) => {
  if (!date) return null;
  // Convert UTC to IST by adding 5.5 hours
  return new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
};

// CONVERT to UTC from IST
export const convertToUTC = (date) => {
  if (!date) return null;
  const istDate = new Date(date);
  const ISTOffset = 5.5 * 60 * 60 * 1000; // in milliseconds
  return new Date(istDate.getTime() - ISTOffset);
};

// GET current IST time (e.g., "14:05")
export const getCurrentTimeIST = () => {
  return formatTime24h(new Date());
};

// FORMAT UTC time string to IST
export const formatToIST = (utcString) => {
  const date = new Date(utcString);
  const options = {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false // set to true if you want AM/PM format
  };

  const istTime = date.toLocaleTimeString("en-IN", options);

  console.log("Original UTC:", utcString);
  console.log("Converted IST:", istTime);

  return istTime;
};

// GET current IST date (e.g., "Mon, May 1")
export const getCurrentDateIST = () => {
  return formatDateDisplay(new Date());
};

// CHECK if date1 is before date2 (based on IST)
export const isDateBefore = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = convertToIST(date1);
  const d2 = convertToIST(date2);
  return d1 < d2;
};

// CHECK if two dates fall on the same IST day
export const isSameDate = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = convertToIST(date1);
  const d2 = convertToIST(date2);
  return d1.toDateString() === d2.toDateString();
};

// SUBTRACT IST offset from a UTC date (convert UTC to IST)
export const subtractISTOffset = (date) => {
  // date is a Date object in UTC
  // IST = UTC + 5:30, so subtracting 5:30 means subtract 5*60 + 30 = 330 minutes
  const offsetMinutes = 330;
  return new Date(date.getTime() - offsetMinutes * 60 * 1000);
};


