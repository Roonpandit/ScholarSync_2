import { useState, useEffect, useCallback } from "react"; 
import axios from "axios"; 
import { toast } from "react-toastify";
import * as XLSX from 'xlsx'; 
import { 
  Calendar, 
  Clock, 
  Plus, 
  X, 
  Users, 
  Check, 
  X as XIcon, 
  User,
  Trash2,
  Camera,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { prepareSlotTimes, formatSlotTimes } from "../../utils/slotUtils"; 
import Modal from "./Modal"; 
import PropTypes from "prop-types"; 
import { 
  formatDateTime, 
  formatDateDisplay, 
  formatTime24h, 
  getCurrentTimeIST, 
  getCurrentDateIST,
  convertToIST,
  convertToUTC,
  isDateBefore,
  isSameDate
} from "../../utils/timeUtils";
import Loader from '../../components/Loader';

const AttendanceSlots = () => {
  // Helper function to get slot status badge
  const getStatusBadge = (slot) => {
    if (slot.status === 'closed') {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800">
          <XCircle className="h-4 w-4 mr-1" />
          Expired
        </span>
      );
    }
    if (slot.status === 'active') {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-4 w-4 mr-1" />
          Active
        </span>
      );
    }
    if (slot.status === 'upcoming') {
      return (
        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-4 w-4 mr-1" />
          Upcoming
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800">
        <X className="h-4 w-4 mr-1" />
        Unknown
      </span>
    );
  };

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  // Function to export slot attendance to Excel
// Function to export slot attendance to Excel
const exportSlotAttendance = () => {
  if (!currentSlot) return;
  try {
    // Get attendance data for this slot
    const slotAttendance = students.map((student) => {
      const studentAttendance = attendance[student._id];
      const isPresent = studentAttendance?.isPresent;
      const photo = studentAttendance?.photo?.url || student.photo?.url;
      const markedAt = studentAttendance?.markedAt;
      const location = studentAttendance?.location;
      
      // Format date and shift
      const date = new Date(currentSlot.date);
      const formattedDate = date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const dateAndShift = `${currentSlot.shift.charAt(0).toUpperCase() + currentSlot.shift.slice(1)}, ${formattedDate}`;
      
      return {
        'Student Code': student.studentCode || 'N/A',
        'Student Name': student.name,
        'Student Email': student.email,
        'Date and Shift': dateAndShift,
        'Attendance Status': isPresent ? 'Present' : 'Absent',
        'Marked At': markedAt ? new Date(markedAt).toLocaleTimeString() : 'N/A',
        'Location': location ? `${location.coordinates[0]}, ${location.coordinates[1]}` : 'N/A',
        'Photo URL': photo || 'N/A'
      };
    }).filter(student => student); // Remove any undefined entries

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    
    // Convert data to array of arrays format
    const headers = Object.keys(slotAttendance[0]);
    const dataRows = slotAttendance.map(student => Object.values(student));
    const worksheetData = [headers, ...dataRows];
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Apply styling to absent student rows
    slotAttendance.forEach((student, index) => {
      if (student['Attendance Status'] === 'Absent') {
        const rowIndex = index + 2; // +2 because: +1 for 0-based index, +1 for header row
        
        // Style each cell in the row
        headers.forEach((header, colIndex) => {
          const cellAddress = XLSX.utils.encode_cell({ r: rowIndex - 1, c: colIndex });
          
          if (!worksheet[cellAddress]) {
            worksheet[cellAddress] = { v: student[header] };
          }
          
          // Apply red background and white text
          worksheet[cellAddress].s = {
            fill: {
              fgColor: { rgb: "FFFF0000" } // Red background
            },
            font: {
              color: { rgb: "FFFFFFFF" } // White text
            },
            alignment: {
              horizontal: "left",
              vertical: "center"
            }
          };
        });
      }
    });
    
    // Set column widths for better readability
    const columnWidths = [
      { wch: 15 }, // Student Code
      { wch: 25 }, // Student Name
      { wch: 30 }, // Student Email
      { wch: 25 }, // Date and Shift
      { wch: 15 }, // Attendance Status
      { wch: 15 }, // Marked At
      { wch: 20 }, // Location
      { wch: 40 }  // Photo URL
    ];
    worksheet['!cols'] = columnWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    
    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      cellStyles: true // Enable cell styling
    });
    
    // Create blob and download
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${currentSlot.date}-${currentSlot.shift}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Attendance data exported successfully');
    
  } catch (error) {
    toast.error('Error exporting attendance data');
    console.error('Excel export error:', error);
  }
};

  // Rest of the component code... 
  const [slots, setSlots] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [showAddForm, setShowAddForm] = useState(false); 
  const [showAttendanceModal, setShowAttendanceModal] = useState(false); 
  const [currentSlot, setCurrentSlot] = useState(null); 
  const [students, setStudents] = useState([]); 
  const [attendance, setAttendance] = useState({}); 
  const [loadingAttendance, setLoadingAttendance] = useState(false); 
 
  const [formData, setFormData] = useState({ 
    shift: "morning", 
    date: new Date().toISOString().split("T")[0], // Format as YYYY-MM-DD
    startTime: "09:00", 
    endTime: "10:00", 
  }); 
 
  const [filterDate, setFilterDate] = useState(""); 
 
  const isSlotExpired = useCallback((slot) => {
    return isDateBefore(slot.endTime, new Date());
  }, []); 
 
 
 
  const fetchSlots = async () => { 
    try { 
      setLoading(true); 
      const token = localStorage.getItem("token"); 
      if (!token) { 
        throw new Error("No authentication token found"); 
      } 
 
      const url = "/admin/attendance-slots"; 
      //console.log("Making request to:", url); 
 
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json", 
          Accept: "application/json", 
        }, 
        withCredentials: true, 
      }; 
 
      const res = await axios.get(url, config); 
      //console.log("Response:", res); 
 
      if (!res.data || !res.data.success) { 
        throw new Error(res.data?.message || "Invalid response format"); 
      } 
 
      const nowIST = convertToIST(new Date());
      const processedSlots = res.data.data.map((slot) => { 
        // Convert times to IST using utility function
        const startTimeIST = convertToIST(new Date(slot.startTime));
        const endTimeIST = convertToIST(new Date(slot.endTime));
        
        // Compare times in IST
        const isExpired = endTimeIST < nowIST;
 
        // If slot is expired and still marked as active, it will be automatically closed by the backend 
        // but we'll handle it on the frontend as well for consistency 
        const isActive = slot.isActive && !isExpired; 
 
        return { 
          ...slot, 
          date: slot.date, // Already in YYYY-MM-DD format 
          startTime: slot.startTime, // Keep as ISO string 
          endTime: slot.endTime, // Keep as ISO string 
          isExpired, 
          isActive, // This will be false if expired, regardless of the backend value 
          displayActive: isActive, 
          formattedDate: formatDateDisplay(startTimeIST), 
          formattedTime: `${formatTime24h(startTimeIST)} - ${formatTime24h(endTimeIST)}`, 
        }; 
      }); 
 
      processedSlots.sort(
        (a, b) => convertToIST(new Date(b.startTime)).getTime() - convertToIST(new Date(a.startTime)).getTime()
      ); 
      setSlots(processedSlots); 
    } catch (error) { 
      console.error("Error fetching attendance slots:", error); 
      toast.error( 
        error.response?.data?.message || "Failed to fetch attendance slots" 
      ); 
    } finally { 
      setLoading(false); 
    } 
  }; 
 
  const handleMarkAttendance = async (studentId, isPresent) => { 
    try { 
      const token = localStorage.getItem("token"); 
      if (!token) { 
        throw new Error("No authentication token found"); 
      } 
 
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json", 
        }, 
      }; 
 
      // console.log("Marking attendance:", { 
      //   studentId, 
      //   slotId: currentSlot._id, 
      //   isPresent, 
      // }); 
 
      const res = await axios.post( 
        "/admin/attendance/mark", 
        { 
          studentId, 
          slotId: currentSlot._id, 
          isPresent, 
          markedAt: getCurrentTimeIST(), 
        }, 
        config 
      ); 
 
      //console.log("Mark attendance response:", res.data); 
 
      if (res.data.success) { 
        // Refresh the attendance data 
        if (currentSlot) { 
          await handleViewAttendance(currentSlot); 
        } 
        toast.success(`Marked as ${isPresent ? "Present" : "Absent"}`); 
      } 
    } catch (error) { 
      console.error("Error marking attendance:", error); 
      toast.error(error.response?.data?.message || "Failed to mark attendance"); 
    } 
  }; 
 
  const handleInputChange = useCallback((e) => { 
    const { name, value } = e.target; 
     
     // For time inputs, convert to proper time format
     if (name === 'startTime' || name === 'endTime') {
       // Ensure time is in HH:mm format
       const time = value.split(':');
       if (time.length === 2) {
         const hours = parseInt(time[0], 10);
         const minutes = parseInt(time[1], 10);
         if (!isNaN(hours) && !isNaN(minutes)) {
           setFormData((prev) => ({ 
             ...prev, 
             [name]: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
           }));
           return;
         }
       }
     }
      
     // For date input, ensure it's in YYYY-MM-DD format
     if (name === 'date') {
       // Date input already provides value in YYYY-MM-DD format
       setFormData((prev) => ({ 
         ...prev, 
         [name]: value, // Keep as string in YYYY-MM-DD format
       }));
       return;
     }
      
     setFormData((prev) => ({ 
       ...prev, 
       [name]: value, 
     })); 
   }, []); 
 
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    
    try {
      // Validate form data
      if (!formData.shift || !formData.date || !formData.startTime || !formData.endTime) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Debug logging
      //console.log('Form data:', formData);

      // Convert times to Date objects
      const slotDate = new Date(formData.date);
      const startTimeParts = formData.startTime.split(':');
      const endTimeParts = formData.endTime.split(':');
      
      const startTime = new Date(slotDate);
      startTime.setHours(parseInt(startTimeParts[0], 10), parseInt(startTimeParts[1], 10), 0);
      
      const endTime = new Date(slotDate);
      endTime.setHours(parseInt(endTimeParts[0], 10), parseInt(endTimeParts[1], 10), 0);
      
      // Create slot data with proper Date objects
      const slotData = {
        date: formData.date,
        startTime,
        endTime,
        shift: formData.shift
      };

      const token = localStorage.getItem("token");
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json", 
        }, 
      };

      // Prepare slot times before sending
      const preparedTimes = prepareSlotTimes(
        slotData.date,
        slotData.startTime,
        slotData.endTime
      );

      const res = await axios.post("/admin/attendance-slots", {
        ...slotData,
        date: preparedTimes.date,
        startTime: preparedTimes.startTime,
        endTime: preparedTimes.endTime
      }, config);

      if (res.data.success) { 
        toast.success("Attendance slot created successfully"); 
        setShowAddForm(false); 
        fetchSlots(); 
      }
    } catch (error) { 
      console.error("Error creating slot:", error); 
      toast.error( 
        error.response?.data?.message || "Failed to create attendance slot" 
      ); 
    }
  }; 
 
  const handleDeleteSlot = async (slotId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      await axios.delete(`/admin/attendance-slots/${slotId}`, config);
      toast.success("Attendance slot deleted successfully");
      // Refresh slots list
      fetchSlots();
    } catch (error) {
      console.error("Error deleting slot:", error);
      toast.error(error.response?.data?.message || "Failed to delete attendance slot");
    }
  };

  const handleViewAttendance = async (slot) => { 
    try { 
      setCurrentSlot(slot); 
      setShowAttendanceModal(true); 
      setLoadingAttendance(true); 
 
      const token = localStorage.getItem("token"); 
      if (!token) { 
        throw new Error("No authentication token found"); 
      } 
 
      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "application/json", 
        }, 
      }; 
 
      //console.log("Fetching data for slot:", slot._id); 
 
      try { 
        // Fetch all students first 
        const studentsRes = await axios.get("/admin/students", config); 
        const allStudents = studentsRes.data.data || []; 
        //console.log("All students:", allStudents); 
 
        // Get attendance for this slot 
        const attendanceRes = await axios.get( 
          `/admin/attendance?slotId=${slot._id}`, 
          config 
        ); 
        const attendanceData = attendanceRes.data.success 
          ? attendanceRes.data.data 
          : []; 
        //console.log("Attendance records:", attendanceData); 
 
        // Create a map of present student IDs for quick lookup 
        const presentStudentIds = new Set(); 
        const attendanceMap = {}; 
 
        // Process present students 
        attendanceData.forEach((record) => { 
          if (record.student) { 
            const studentId = record.student._id || record.student; 
            presentStudentIds.add(studentId); 
            attendanceMap[studentId] = { 
              isPresent: true, 
              markedAt: record.markedAt, 
              location: record.location, 
              photo: record.photo, 
              studentCode: 
                record.studentCode || record.student?.studentCode || "", 
            }; 
          } 
        }); 
 
        //console.log("Present student IDs:", presentStudentIds); 
 
        // Process all students to include absent ones 
        const processedStudents = allStudents.map((student) => { 
          const isPresent = presentStudentIds.has(student._id); 
          if (!isPresent) { 
            // Add absent students to the attendance map 
            attendanceMap[student._id] = { 
              isPresent: false, 
              markedAt: null, 
              location: null, 
              photo: null, 
              studentCode: student.studentCode || "", 
            }; 
          } 
          return { 
            _id: student._id, 
            name: student.name || "Unknown", 
            email: student.email || "", 
            rollNumber: student.rollNumber || "", 
            studentCode: student.studentCode || "", 
          }; 
        }); 
 
        //console.log("Processed students:", processedStudents); 
        //console.log("Attendance map:", attendanceMap); 
 
        setStudents(processedStudents); 
        setAttendance(attendanceMap); 
      } catch (error) { 
        console.error("Error in API calls:", error); 
        throw error; 
      } 
    } catch (error) { 
      console.error("Error fetching attendance data:", error); 
      toast.error( 
        error.response?.data?.message || "Failed to load attendance data" 
      ); 
    } finally { 
      setLoadingAttendance(false); 
    } 
  }; 
 
  const getShiftColor = useCallback((shift) => { 
    switch (shift) { 
      case "morning": 
        return "bg-blue-100 text-blue-800"; 
      case "afternoon": 
        return "bg-green-100 text-green-800"; 
      case "evening": 
        return "bg-purple-100 text-purple-800"; 
      default: 
        return "bg-gray-100 text-gray-800"; 
    } 
  }, []); 
 
  useEffect(() => { 
    fetchSlots(); 
  }, []); 
 
  if (loading) {
    return <Loader message="Loading attendance slots..." />;
  } 
 
  return ( 
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6"> 
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"> 
        <div> 
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center"> 
            <Clock className="mr-2 text-blue-500" size={20} /> 
            Attendance Slots 
          </h1> 
          <p className="text-gray-500 text-sm mt-1"> 
            {slots.length > 0 
              ? `Showing ${slots.length} attendance slot${ 
                  slots.length !== 1 ? "s" : "" 
                }` 
              : "No attendance slots found"} 
          </p> 
        </div> 
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto"> 
          <div className="relative flex-1"> 
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"> 
              <Calendar className="h-4 w-4 text-gray-400" /> 
            </div> 
            <input 
              type="date" 
              value={filterDate} 
              onChange={(e) => setFilterDate(e.target.value)} 
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm" 
            /> 
          </div> 
          <button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${ 
              showAddForm 
                ? "bg-gray-500 hover:bg-gray-600" 
                : "bg-blue-600 hover:bg-blue-700" 
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200`} 
          > 
            {showAddForm ? ( 
              <> 
                <X size={16} className="mr-2" /> 
                Cancel 
              </> 
            ) : ( 
              <> 
                <Plus size={16} className="mr-2" /> 
                New Slot 
              </> 
            )} 
          </button> 
        </div> 
      </div> 
 
      {showAddForm && ( 
        <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-6 border border-gray-200"> 
          <h2 className="text-lg font-medium text-gray-800 mb-4"> 
            Create New Attendance Slot 
          </h2> 
          <form onSubmit={handleSubmit}> 
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"> 
              <div className="flex flex-col"> 
                <label htmlFor="shift" className="text-sm text-gray-600 mb-1"> 
                  Shift 
                </label> 
                <select 
                  id="shift" 
                  name="shift" 
                  value={formData.shift} 
                  onChange={handleInputChange} 
                  required 
                  className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                > 
                  <option value="morning">Morning</option> 
                  <option value="afternoon">Afternoon</option> 
                  <option value="evening">Evening</option> 
                </select> 
              </div> 
 
              <div className="flex flex-col"> 
                <label htmlFor="date" className="text-sm text-gray-600 mb-1"> 
                  Date 
                </label> 
                <input 
                  type="date" 
                  id="date" 
                  name="date" 
                  value={formData.date} 
                  onChange={handleInputChange} 
                  required 
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                /> 
              </div> 
 
              <div className="flex flex-col"> 
                <label 
                  htmlFor="startTime" 
                  className="text-sm text-gray-600 mb-1" 
                > 
                  Start Time 
                </label> 
                <input 
                  type="time" 
                  id="startTime" 
                  name="startTime" 
                  value={formData.startTime} 
                  onChange={handleInputChange} 
                  step="60" // Restrict to minutes only 
                  required 
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                /> 
              </div> 
 
              <div className="flex flex-col"> 
                <label htmlFor="endTime" className="text-sm text-gray-600 mb-1"> 
                  End Time 
                </label> 
                <input 
                  type="time" 
                  id="endTime" 
                  name="endTime" 
                  value={formData.endTime} 
                  onChange={handleInputChange} 
                  step="60" // Restrict to minutes only 
                  required 
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                /> 
              </div> 
            </div> 
 
            <div className="mt-6 flex justify-end space-x-3"> 
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)} 
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" 
              > 
                Cancel 
              </button> 
              <button 
                type="submit" 
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" 
              > 
                Create Slot 
              </button> 
            </div> 
          </form> 
        </div> 
      )} 
 
      <div className="mt-8"> 
        {slots.length === 0 ? ( 
          <div className="text-center py-12"> 
            <Clock className="mx-auto h-12 w-12 text-gray-400" /> 
            <h3 className="mt-2 text-sm font-medium text-gray-900">No slots</h3> 
            <p className="mt-1 text-sm text-gray-500"> 
              {filterDate 
                ? `No slots found for ${new Date( 
                    filterDate 
                  ).toLocaleDateString()}` 
                : "Create a new attendance slot to get started."} 
            </p> 
            {filterDate && ( 
              <button 
                onClick={() => setFilterDate("")} 
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" 
              > 
                Show all slots 
              </button> 
            )} 
          </div> 
        ) : ( 
<div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle border-b border-gray-200 sm:rounded-lg shadow ring-1 ring-black ring-opacity-5">
              {/* Added fixed height container with vertical scrolling */}
              <div className="max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-300"> 
                  <thead className="bg-gray-50 sticky top-0 z-10"> 
                    <tr> 
                      <th 
                        scope="col" 
                        className="px-3 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-900" 
                      > 
                        Date & Time 
                      </th> 
                      <th 
                        scope="col" 
                        className="px-3 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-900" 
                      > 
                        Shift 
                      </th> 
                      <th 
                        scope="col" 
                        className="px-3 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-900" 
                      > 
                        Status 
                      </th> 
                      <th 
                        scope="col" 
                        className="px-3 py-3.5 text-right-17 text-xs sm:text-sm font-semibold text-gray-900" 
                      > 
                        Action 
                      </th>
                    </tr> 
                  </thead> 
                  <tbody className="divide-y divide-gray-200 bg-white"> 
                    {slots 
                      .filter((slot) => { 
                        if (!filterDate) return true; 
                        // Convert both dates to Date objects before comparison
                        return isSameDate(
                          new Date(slot.date),
                          new Date(filterDate)
                        );
                      }) 
                      .map((slot) => ( 
                        <tr 
                          key={slot._id} 
                          className={`hover:bg-gray-50 ${ 
                            slot.isExpired ? "opacity-70" : "" 
                          }`} 
                        > 
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-xs sm:text-sm sm:pl-6"> 
                            <div className="flex items-center"> 
                              <div className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-50"> 
                                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" /> 
                              </div> 
                              <div className="ml-2 sm:ml-4"> 
                                <div className="font-medium text-gray-900"> 
                                  {new Date(slot.date).toLocaleDateString('en-US', { 
                                    weekday: 'short',
                                    day: 'numeric',
                                    month: 'short'
                                  })} 
                                </div> 
                                <div className="text-gray-500"> 
                                  {new Date(slot.startTime).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    hour12: false,
                                    timeZone: 'Asia/Kolkata'
                                  })} - {new Date(slot.endTime).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: 'numeric',
                                    hour12: false,
                                    timeZone: 'Asia/Kolkata'
                                  })} 
                                </div>
                                <div className="text-gray-500 sm:hidden mt-1">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getShiftColor(
                                      slot.shift
                                    )}`}
                                  >
                                    {slot.shift.charAt(0).toUpperCase() +
                                      slot.shift.slice(1)}
                                  </span>
                                </div>
                              </div> 
                            </div> 
                          </td> 
                          <td className="whitespace-nowrap px-3 py-4 text-xs sm:text-sm text-gray-500 hidden sm:table-cell"> 
                            <span 
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getShiftColor( 
                                slot.shift 
                              )}`} 
                            > 
                              {slot.shift.charAt(0).toUpperCase() + 
                                slot.shift.slice(1)} 
                            </span> 
                          </td> 
                          <td className="whitespace-nowrap px-3 py-4 text-xs sm:text-sm"> 
                            {getStatusBadge(slot)} 
                          </td> 
                          <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-xs sm:text-sm font-medium sm:pr-6"> 
                            <div className="flex justify-end space-x-3"> 
                              <button 
                                onClick={() => handleViewAttendance(slot)} 
                                className="text-blue-600 hover:text-blue-900 flex items-center" 
                                title="View Attendance" 
                              > 
                                <Users className="h-4 w-4 mr-1" /> 
                                <span className="hidden sm:inline">View</span> 
                              </button> 
                              <button 
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this attendance slot?')) {
                                    handleDeleteSlot(slot._id);
                                  }
                                }} 
                                className="text-red-600 hover:text-red-900 flex items-center" 
                                title="Delete Slot" 
                              > 
                                <Trash2 className="h-4 w-4 mr-1" /> 
                                <span className="hidden sm:inline">Delete</span> 
                              </button>
                            </div> 
                          </td> 
                        </tr> 
                      ))} 
                  </tbody> 
                </table>
              </div> 
            </div>
          </div>
        )} 
      </div> 
 {/* Attendance Modal */}
 <Modal
  isOpen={showAttendanceModal}
  onClose={() => setShowAttendanceModal(false)}
  title={`Attendance for ${
    currentSlot ? formatDateDisplay(currentSlot.date) : ""
  } - ${currentSlot?.shift ? currentSlot.shift.charAt(0).toUpperCase() + currentSlot.shift.slice(1) : ""}
`}
  size="xl"
>
  {currentSlot && (
    <div className="space-y-4 max-h-[70vh] flex flex-col">
      {loadingAttendance ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0 sticky top-0 bg-white pt-2 pb-2 z-10">
            <div className="text-sm text-gray-500">
             <strong>Slot Time: </strong>{new Date(currentSlot.startTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: false,
                timeZone: 'Asia/Kolkata'
              })} - {new Date(currentSlot.endTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: false,
                timeZone: 'Asia/Kolkata'
              })}
            </div>
            <div className="flex space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {Object.values(attendance).filter((a) => a?.isPresent).length} Present
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-200 text-gray-800">
                {Object.values(attendance).filter((a) => !a?.isPresent).length} Absent
              </span>
              <button
                onClick={exportSlotAttendance}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
              >
                Export
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-grow border border-gray-200 rounded-lg custom-scrollbar pr-1">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th
                      scope="col"
                      className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Student Code
                    </th>
                    <th
                      scope="col"
                      className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Student Name
                    </th>
                    <th
                      scope="col"
                      className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Marked At
                    </th>
                    <th
                      scope="col"
                      className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Photo
                    </th>
                    <th
                      scope="col"
                      className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Location (Lng, Lat)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-2 sm:px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No attendance records found
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => {
                      const studentAttendance = attendance[student._id];
                      const isPresent = studentAttendance?.isPresent;
                      const markedAt = studentAttendance?.markedAt;
                      const location = studentAttendance?.location;
                      const photo = studentAttendance?.photo;

                      return (
                        <tr key={student._id} className="hover:bg-gray-50">
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                            {student.studentCode || "N/A"}
                          </td>
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-medium text-gray-900">
                              {student.name}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                              {student.email}
                            </div>
                          </td>
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                isPresent
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-200 text-gray-800"
                              }`}
                            >
                              {isPresent ? "Present" : "Absent"}
                            </span>
                          </td>
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            {markedAt ? new Date(markedAt).toLocaleTimeString() : "N/A"}
                          </td>
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            {photo?.url ? (
                              <button
                                onClick={() => {
                                  setSelectedPhoto(photo.url);
                                  setPhotoModalOpen(true);
                                }}
                                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <Camera className="w-3 h-3 mr-1" />
                                View
                              </button>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                            {location ? `${location.coordinates[0]}, ${location.coordinates[1]}` : "N/A"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )}
  
  {/* Photo Modal */}
  {photoModalOpen && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-11/12 sm:w-96 max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center p-3 border-b">
          <h3 className="text-sm font-medium">Student Photo</h3>
          <button
            onClick={() => setPhotoModalOpen(false)}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-3">
          {selectedPhoto ? (
            <img
              src={selectedPhoto}
              alt="Student"
              className="w-full max-h-[60vh] object-contain rounded-lg"
            />
          ) : (
            <div className="text-center text-gray-500 py-6">
              <Camera className="w-6 h-6 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No photo available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )}
</Modal>

<Modal
  isOpen={showAddForm}
  onClose={() => setShowAddForm(false)}
  title="Create New Attendance Slot"
  size="lg"
>
  <form onSubmit={handleSubmit}>
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label
            htmlFor="shift"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Shift
          </label>
          <select
            id="shift"
            name="shift"
            value={formData.shift}
            onChange={handleInputChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          >
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="startTime"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Start Time
          </label>
          <input
            type="time"
            id="startTime"
            name="startTime"
            value={formData.startTime}
            onChange={handleInputChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label
            htmlFor="endTime"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            End Time
          </label>
          <input
            type="time"
            id="endTime"
            name="endTime"
            value={formData.endTime}
            onChange={handleInputChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
        <button
          type="button"
          onClick={() => setShowAddForm(false)}
          className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create Slot
        </button>
      </div>
    </div>
  </form>
</Modal>
    </div>
  );
};

export default AttendanceSlots;