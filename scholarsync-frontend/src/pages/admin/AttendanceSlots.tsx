import { useState, useEffect, useCallback, type ChangeEvent, type FormEvent } from 'react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { Calendar, Clock, Plus, X, Users, Check, X as XIcon, Trash2, Camera, CheckCircle, XCircle } from 'lucide-react';
import { prepareSlotTimes } from '@/utils/slotUtils';
import Modal from './Modals';
import { formatDateDisplay, formatTime24h, convertToIST, isDateBefore, isSameDate } from '@/utils/timeUtils';
import { get, post, del } from '@/services/http-client';
import { API_ENDPOINTS } from '@/services/ApiEndPoints/apiEndpoints';
import type { ApiResponse } from '@/types/common.types';
import Loader from '@/components/Loader';

interface LectureRef { id: string; name: string; isDefault: boolean; }
interface SlotData { id: string; date: string; startTime: string; endTime: string; shift: string; status: string; isActive: boolean; lecture?: LectureRef; isExpired?: boolean; displayActive?: boolean; formattedDate?: string; formattedTime?: string; [key: string]: unknown; }
interface PhotoData { url: string; }
interface LocationData { coordinates: number[]; }
interface AttendanceMapEntry { id: string; isPresent: boolean; status: string; markedAt?: string; location?: LocationData; photo?: PhotoData; studentCode: string; }
interface StudentData { id: string; name: string; email: string; studentCode: string; rollNumber?: string; }
interface FormData { shift: string; date: string; startTime: string; endTime: string; lectures: string[]; }
interface ReviewStatus { hasPendingReviews: boolean; pendingCount: number; }

const AttendanceSlots = () => {
  const getStatusBadge = (slot: SlotData) => {
    if (slot.status === 'closed') return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-800"><XCircle className="h-4 w-4 mr-1" />Expired</span>;
    if (slot.status === 'active') return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="h-4 w-4 mr-1" />Active</span>;
    if (slot.status === 'upcoming') return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="h-4 w-4 mr-1" />Upcoming</span>;
    return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800"><X className="h-4 w-4 mr-1" />Unknown</span>;
  };

  const getReviewStatus = async (slotId: string): Promise<ReviewStatus> => {
    try {
      const response = await get<ApiResponse<Array<{ status: string }>>>(API_ENDPOINTS.ATTENDANCE.LIST, { slotId });
      const records = response?.data || [];
      const awaitingApproval = records.filter(r => r.status === 'awaiting_approval').length;
      return { hasPendingReviews: awaitingApproval > 0, pendingCount: awaitingApproval };
    } catch { return { hasPendingReviews: false, pendingCount: 0 }; }
  };

  const getReviewBadge = (slot: SlotData, pendingCount: number) => {
    if (slot.status !== 'closed') return null;
    if (pendingCount > 0) return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 ml-2">Review Pending ({pendingCount})</span>;
    return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 ml-2">Review Done</span>;
  };

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  const [slots, setSlots] = useState<SlotData[]>([]);
  const [lectures, setLectures] = useState<LectureRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [currentSlot, setCurrentSlot] = useState<SlotData | null>(null);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceMapEntry>>({});
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [creatingSlot, setCreatingSlot] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<SlotData | null>(null);
  const [deletingSlot, setDeletingSlot] = useState(false);

  const [formData, setFormData] = useState<FormData>({ shift: 'morning', date: new Date().toISOString().split('T')[0], startTime: '09:00', endTime: '10:00', lectures: [] });
  const [filterDate, setFilterDate] = useState('');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'done'>('all');
  const [slotReviewStatus, setSlotReviewStatus] = useState<Record<string, ReviewStatus>>({});
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'needs_review' | 'reviewed'>('all');

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const res = await get<ApiResponse<SlotData[]> & { success?: boolean }>(API_ENDPOINTS.ATTENDANCE_SLOTS.LIST);
      if (!res?.data) throw new Error('Invalid response format');
      const nowIST = convertToIST(new Date());
      const processedSlots = (res.data || []).map((slot: SlotData) => {
        const startTimeIST = convertToIST(new Date(slot.startTime));
        const endTimeIST = convertToIST(new Date(slot.endTime));
        const isExpired = endTimeIST < nowIST;
        const isActive = slot.isActive && !isExpired;
        return { ...slot, isExpired, isActive, displayActive: isActive, formattedDate: formatDateDisplay(startTimeIST), formattedTime: `${formatTime24h(startTimeIST)} - ${formatTime24h(endTimeIST)}` };
      }).sort((a: SlotData, b: SlotData) => convertToIST(new Date(b.startTime)).getTime() - convertToIST(new Date(a.startTime)).getTime());
      setSlots(processedSlots);

      const reviewStatusMap: Record<string, ReviewStatus> = {};
      const closedSlots = processedSlots.filter((slot: SlotData) => slot.status === 'closed');
      await Promise.all(closedSlots.map(async (slot: SlotData) => { reviewStatusMap[slot.id] = await getReviewStatus(slot.id); }));
      setSlotReviewStatus(reviewStatusMap);
    } catch (error) { console.error('Error fetching attendance slots:', error); const err = error as { response?: { data?: { message?: string } } }; toast.error(err.response?.data?.message || 'Failed to fetch attendance slots'); }
    finally { setLoading(false); }
  };

  const handleMarkAttendance = async (studentId: string, isPresent: boolean) => {
    try {
      const res = await post<ApiResponse & { success?: boolean }>(API_ENDPOINTS.ATTENDANCE.MARK, { studentId, slotId: currentSlot!.id, isPresent, markedAt: new Date().toISOString() });
      if (res?.status === 200) { if (currentSlot) await handleViewAttendance(currentSlot); toast.success(`Marked as ${isPresent ? 'Present' : 'Absent'}`); }
    } catch (error) { console.error('Error marking attendance:', error); const err = error as { response?: { data?: { message?: string } } }; toast.error(err.response?.data?.message || 'Failed to mark attendance'); }
  };

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'startTime' || name === 'endTime') { const time = value.split(':'); if (time.length === 2) { const hours = parseInt(time[0], 10); const minutes = parseInt(time[1], 10); if (!isNaN(hours) && !isNaN(minutes)) { setFormData((prev) => ({ ...prev, [name]: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}` })); return; } } }
    if (name === 'date') { setFormData((prev) => ({ ...prev, [name]: value })); return; }
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleLectureToggle = (lectureId: string) => { setFormData(prev => ({ ...prev, lectures: prev.lectures.includes(lectureId) ? prev.lectures.filter(id => id !== lectureId) : [...prev.lectures, lectureId] })); };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setCreatingSlot(true);
      if (!formData.shift || !formData.date || !formData.startTime || !formData.endTime) { toast.error('Please fill in all required fields'); return; }
      if (!formData.lectures || formData.lectures.length === 0) { toast.error('Please select at least one lecture'); return; }
      const slotDate = new Date(formData.date);
      const startTimeParts = formData.startTime.split(':');
      const endTimeParts = formData.endTime.split(':');
      const startTime = new Date(slotDate); startTime.setHours(parseInt(startTimeParts[0], 10), parseInt(startTimeParts[1], 10), 0);
      const endTime = new Date(slotDate); endTime.setHours(parseInt(endTimeParts[0], 10), parseInt(endTimeParts[1], 10), 0);
      const slotData = { date: formData.date, startTime, endTime, shift: formData.shift, lectures: formData.lectures };
      const preparedTimes = prepareSlotTimes(slotData.date, slotData.startTime, slotData.endTime);
      const res = await post<ApiResponse & { success?: boolean }>(API_ENDPOINTS.ATTENDANCE_SLOTS.CREATE, { ...slotData, date: preparedTimes.date, startTime: preparedTimes.startTime, endTime: preparedTimes.endTime });
      if (res?.status === 200 || res?.status === 201) { const slotsCount = formData.lectures.length; toast.success(`${slotsCount} attendance slot${slotsCount > 1 ? 's' : ''} created successfully`); setShowAddForm(false); setFormData({ shift: 'morning', date: new Date().toISOString().split('T')[0], startTime: '09:00', endTime: '10:00', lectures: [] }); fetchSlots(); }
    } catch (error) { console.error('Error creating slot:', error); const err = error as { response?: { data?: { message?: string } } }; toast.error(err.response?.data?.message || 'Failed to create attendance slot'); }
    finally { setCreatingSlot(false); }
  };

  const exportSlotAttendance = () => {
    if (!currentSlot) return;
    try {
      const slotAttendance = students.map((student: StudentData) => {
        const studentAttendance = attendance[student.id] as AttendanceMapEntry | undefined;
        const isPresent = studentAttendance?.isPresent;
        const markedAt = studentAttendance?.markedAt;
        const location = studentAttendance?.location;
        const photo = studentAttendance?.photo?.url;

        const date = new Date(currentSlot.date);
        const formattedDate = date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
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
      }).filter(Boolean);

      const workbook = XLSX.utils.book_new();
      const headers = Object.keys(slotAttendance[0]);
      const dataRows = slotAttendance.map((student: Record<string, unknown>) => Object.values(student));
      const worksheetData = [headers, ...dataRows];
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

      slotAttendance.forEach((student: Record<string, unknown>, index: number) => {
        if (student['Attendance Status'] === 'Absent') {
          const rowIndex = index + 2;
          headers.forEach((_header: string, colIndex: number) => {
            const cellAddress = XLSX.utils.encode_cell({ r: rowIndex - 1, c: colIndex });
            if (!worksheet[cellAddress]) {
              worksheet[cellAddress] = { v: student[headers[colIndex]] };
            }
            worksheet[cellAddress].s = {
              fill: { fgColor: { rgb: 'FFFF0000' } },
              font: { color: { rgb: 'FFFFFFFF' } },
              alignment: { horizontal: 'left', vertical: 'center' }
            };
          });
        }
      });

      worksheet['!cols'] = [
        { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 25 },
        { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 40 }
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', cellStyles: true });
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

  const handleDeleteSlot = async (slotId: string) => {
    try { setDeletingSlot(true); await del(API_ENDPOINTS.ATTENDANCE_SLOTS.DELETE(slotId)); toast.success('Attendance slot deleted successfully'); setShowDeleteModal(false); setSlotToDelete(null); fetchSlots(); }
    catch (error) { console.error('Error deleting slot:', error); const err = error as { response?: { data?: { message?: string } } }; toast.error(err.response?.data?.message || 'Failed to delete attendance slot'); }
    finally { setDeletingSlot(false); }
  };

  const handleViewAttendance = async (slot: SlotData) => {
    try {
      setCurrentSlot(slot); setShowAttendanceModal(true); setLoadingAttendance(true); setAttendanceFilter('all');
      const studentsRes = await get<ApiResponse<StudentData[]>>(API_ENDPOINTS.STUDENTS);
      const allStudents = studentsRes?.data || [];
      const attendanceRes = await get<ApiResponse<Array<{ id: string; student: StudentData | string; isPresent?: boolean; status: string; markedAt?: string; location?: LocationData; photo?: PhotoData; studentCode?: string }>> & { success?: boolean }>(API_ENDPOINTS.ATTENDANCE.LIST, { slotId: slot.id });
      const attendanceData = attendanceRes?.data || [];
      const presentStudentIds = new Set<string>();
      const attendanceMap: Record<string, AttendanceMapEntry> = {};
      attendanceData.forEach((record) => {
        if (record.student) {
          const studentId = typeof record.student === 'string' ? record.student : record.student.id;
          presentStudentIds.add(studentId);
          attendanceMap[studentId] = { id: record.id, isPresent: record.isPresent !== undefined ? record.isPresent : true, status: record.status || (record.isPresent ? 'present' : 'absent'), markedAt: record.markedAt, location: record.location, photo: record.photo, studentCode: record.studentCode || (typeof record.student !== 'string' ? record.student.studentCode : '') || '' };
        }
      });
      const processedStudents = allStudents.filter(student => presentStudentIds.has(student.id)).map((student) => ({ id: student.id, name: student.name || 'Unknown', email: student.email || '', rollNumber: '', studentCode: student.studentCode || '' }));
      setStudents(processedStudents); setAttendance(attendanceMap);
    } catch (error) { console.error('Error fetching attendance data:', error); const err = error as { response?: { data?: { message?: string } } }; toast.error(err.response?.data?.message || 'Failed to load attendance data'); }
    finally { setLoadingAttendance(false); }
  };

  const handleApproveAttendance = async (attendanceId: string) => {
    if (!attendanceId) { toast.error('Attendance ID is missing'); return; }
    try { await post(API_ENDPOINTS.ATTENDANCE.STATUS(attendanceId), { action: 'approve' }); toast.success('Attendance approved successfully'); if (currentSlot) await handleViewAttendance(currentSlot); }
    catch (error) { console.error('Error approving attendance:', error); const err = error as { response?: { data?: { message?: string } } }; toast.error(err.response?.data?.message || 'Failed to approve attendance'); }
  };

  const handleRejectAttendance = async (attendanceId: string) => {
    const remark = prompt('Please provide a reason for rejecting this attendance:');
    if (!remark?.trim()) { toast.error('Rejection reason is required'); return; }
    try { await post(API_ENDPOINTS.ATTENDANCE.STATUS(attendanceId), { action: 'reject', remark: remark.trim() }); toast.success('Attendance rejected successfully. Student has been notified.'); if (currentSlot) await handleViewAttendance(currentSlot); }
    catch (error) { console.error('Error rejecting attendance:', error); const err = error as { response?: { data?: { message?: string } } }; toast.error(err.response?.data?.message || 'Failed to reject attendance'); }
  };

  useEffect(() => { fetchSlots(); fetchLectures(); }, []);

  const fetchLectures = async () => {
    try { const res = await get<ApiResponse<LectureRef[]>>(API_ENDPOINTS.LECTURES.LIST); setLectures(res?.data || []); }
    catch (error) { console.error('Error fetching lectures:', error); toast.error('Failed to load lectures'); setLectures([]); }
  };

  if (loading) return <Loader />;

  const filteredSlots = slots.filter((slot) => {
    if (filterDate && !isSameDate(new Date(slot.date), new Date(filterDate))) return false;
    if (reviewFilter === 'all') return true;
    if (reviewFilter === 'pending') return slot.status === 'closed' && slotReviewStatus[slot.id]?.hasPendingReviews;
    if (reviewFilter === 'done') return slot.status === 'closed' && !slotReviewStatus[slot.id]?.hasPendingReviews;
    return true;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div><h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center"><Clock className="mr-2 text-blue-500" size={20} />Attendance Slots</h1><p className="text-gray-500 text-sm mt-1">{slots.length > 0 ? `Showing ${slots.length} attendance slot${slots.length !== 1 ? 's' : ''}` : 'No attendance slots found'}</p></div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Calendar className="h-4 w-4 text-gray-400" /></div><input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm" /></div>
          <button onClick={() => setShowAddForm(true)} className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${showAddForm ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200`}>
            {showAddForm ? (<><X size={16} className="mr-2" />Cancel</>) : (<><Plus size={16} className="mr-2" />New Slot</>)}
          </button>
        </div>
      </div>

      <div className="mt-8">
        {slots.length === 0 ? (
          <div className="text-center py-12"><Clock className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-medium text-gray-900">No slots</h3><p className="mt-1 text-sm text-gray-500">{filterDate ? `No slots found for ${new Date(filterDate).toLocaleDateString()}` : 'Create a new attendance slot to get started.'}</p>{filterDate && <button onClick={() => setFilterDate('')} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700">Show all slots</button>}</div>
        ) : (
          <>
            <div className="mb-6 border-b border-gray-200"><nav className="-mb-px flex space-x-8">
              <button onClick={() => setReviewFilter('all')} className={`${reviewFilter === 'all' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}>All Slots ({slots.length})</button>
              <button onClick={() => setReviewFilter('pending')} className={`${reviewFilter === 'pending' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}>Review Pending ({slots.filter(s => s.status === 'closed' && slotReviewStatus[s.id]?.hasPendingReviews).length})</button>
              <button onClick={() => setReviewFilter('done')} className={`${reviewFilter === 'done' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}>Review Done ({slots.filter(s => s.status === 'closed' && !slotReviewStatus[s.id]?.hasPendingReviews).length})</button>
            </nav></div>

            <div className="overflow-x-auto -mx-4 sm:mx-0"><div className="inline-block min-w-full align-middle border-b border-gray-200 sm:rounded-lg shadow ring-1 ring-black ring-opacity-5"><div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50 sticky top-0 z-10"><tr><th scope="col" className="px-3 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-900">Date & Time</th><th scope="col" className="px-3 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-900">Lecture Name</th><th scope="col" className="px-3 py-3.5 text-left text-xs sm:text-sm font-semibold text-gray-900">Status</th><th scope="col" className="px-3 py-3.5 text-right text-xs sm:text-sm font-semibold text-gray-900">Action</th></tr></thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredSlots.length === 0 ? <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No slots found</td></tr> :
                  filteredSlots.map((slot) => (
                    <tr key={slot.id} className={`hover:bg-gray-50 ${slot.isExpired ? 'opacity-70' : ''}`}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-xs sm:text-sm sm:pl-6">
                        <div className="flex items-center"><div className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-blue-50"><Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" /></div>
                        <div className="ml-2 sm:ml-4"><div className="font-medium text-gray-900">{new Date(slot.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}</div><div className="text-gray-500">{new Date(slot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' })} - {new Date(slot.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' })}</div></div></div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-xs sm:text-sm text-gray-700 hidden sm:table-cell"><div className="flex items-center"><span className="font-medium">{slot.lecture?.name || 'N/A'}</span>{slot.lecture?.isDefault && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Default</span>}</div></td>
                      <td className="whitespace-nowrap px-3 py-4 text-xs sm:text-sm"><div className="flex items-center">{getStatusBadge(slot)}{getReviewBadge(slot, slotReviewStatus[slot.id]?.pendingCount || 0)}</div></td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-xs sm:text-sm font-medium sm:pr-6"><div className="flex justify-end space-x-3"><button onClick={() => handleViewAttendance(slot)} className="text-blue-600 hover:text-blue-900 flex items-center" title="View Attendance"><Users className="h-4 w-4 mr-1" /><span className="hidden sm:inline">View</span></button><button onClick={() => { setSlotToDelete(slot); setShowDeleteModal(true); }} className="text-red-600 hover:text-red-900 flex items-center" title="Delete Slot"><Trash2 className="h-4 w-4 mr-1" /><span className="hidden sm:inline">Delete</span></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div></div></div>
          </>
        )}
      </div>

      {/* Attendance Modal */}
      <Modal isOpen={showAttendanceModal} onClose={() => setShowAttendanceModal(false)} title={`Attendance for ${currentSlot ? formatDateDisplay(currentSlot.date) : ''} - ${currentSlot?.shift ? currentSlot.shift.charAt(0).toUpperCase() + currentSlot.shift.slice(1) : ''}`} size="xl">
        {currentSlot && (
          <div className="space-y-4 max-h-[70vh] flex flex-col">
            {loadingAttendance ? <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div> : (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0 sticky top-0 bg-white pt-2 pb-2 z-10">
                  <div className="text-sm text-gray-500"><strong>Slot Time: </strong>{new Date(currentSlot.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' })} - {new Date(currentSlot.endTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' })}</div>
                  <div className="flex space-x-2 flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{Object.values(attendance).filter((a) => a?.status === 'pending').length} Pending</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">{Object.values(attendance).filter((a) => a?.status === 'awaiting_approval').length} Awaiting</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{Object.values(attendance).filter((a) => a?.status === 'present').length} Present</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">{Object.values(attendance).filter((a) => a?.status === 'absent').length} Absent</span>
                    <button onClick={exportSlotAttendance} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200">Export</button>
                  </div>
                </div>
                <div className="mb-4 flex space-x-2 bg-gray-100 p-1 rounded-lg">
                  <button onClick={() => setAttendanceFilter('all')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${attendanceFilter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>All ({students.length})</button>
                  <button onClick={() => setAttendanceFilter('needs_review')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${attendanceFilter === 'needs_review' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Needs Review ({students.filter(s => attendance[s.id]?.status === 'awaiting_approval').length})</button>
                  <button onClick={() => setAttendanceFilter('reviewed')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${attendanceFilter === 'reviewed' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>Reviewed ({students.filter(s => { const status = attendance[s.id]?.status; return status === 'present' || status === 'absent'; }).length})</button>
                </div>
                <div className="overflow-y-auto flex-grow border border-gray-200 rounded-lg custom-scrollbar pr-1"><div className="overflow-x-auto">
                  {(() => {
                    const filtered = students.filter(student => { if (attendanceFilter === 'all') return true; const s = attendance[student.id]?.status; if (attendanceFilter === 'needs_review') return s === 'awaiting_approval'; if (attendanceFilter === 'reviewed') return s === 'present' || s === 'absent'; return true; });
                    return (
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0 z-10"><tr><th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Code</th><th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th><th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marked At</th><th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Photo</th><th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th><th className="px-2 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th></tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filtered.length === 0 ? <tr><td colSpan={7} className="px-2 sm:px-6 py-4 text-center text-sm text-gray-500">No attendance records found</td></tr> :
                          filtered.map((student) => {
                            const sa = attendance[student.id];
                            const status = sa?.status || 'pending';
                            let bgColor = 'bg-yellow-100 text-yellow-800'; let statusText = 'Pending';
                            if (status === 'awaiting_approval') { bgColor = 'bg-orange-100 text-orange-800'; statusText = 'Awaiting Approval'; }
                            else if (status === 'present') { bgColor = 'bg-green-100 text-green-800'; statusText = 'Present'; }
                            else if (status === 'absent') { bgColor = 'bg-red-100 text-red-800'; statusText = 'Absent'; }
                            return (
                              <tr key={student.id} className="hover:bg-gray-50">
                                <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{student.studentCode || 'N/A'}</td>
                                <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap"><div className="text-xs sm:text-sm font-medium text-gray-900">{student.name}</div><div className="text-xs sm:text-sm text-gray-500 hidden sm:block">{student.email}</div></td>
                                <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor}`}>{statusText}</span></td>
                                <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{sa?.markedAt ? new Date(sa.markedAt).toLocaleTimeString() : 'N/A'}</td>
                                <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{sa?.photo?.url ? <button onClick={() => { setSelectedPhoto(sa.photo!.url); setPhotoModalOpen(true); }} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100"><Camera className="w-3 h-3 mr-1" />View</button> : 'N/A'}</td>
                                <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{sa?.location ? `${sa.location.coordinates[0]}, ${sa.location.coordinates[1]}` : 'N/A'}</td>
                                <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm">{sa?.status === 'awaiting_approval' && (<div className="flex gap-2"><button onClick={() => handleApproveAttendance(sa.id)} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"><Check className="w-3 h-3 mr-1" />Approve</button><button onClick={() => handleRejectAttendance(sa.id)} className="inline-flex items-center px-2 py-1 text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"><X className="w-3 h-3 mr-1" />Reject</button></div>)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    );
                  })()}
                </div></div>
              </>
            )}
          </div>
        )}
        {photoModalOpen && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"><div className="bg-white rounded-lg max-w-md w-11/12 sm:w-96 max-h-[80vh] overflow-auto"><div className="flex justify-between items-center p-3 border-b"><h3 className="text-sm font-medium">Student Photo</h3><button onClick={() => setPhotoModalOpen(false)} className="text-gray-400 hover:text-gray-500"><X className="w-4 h-4" /></button></div><div className="p-3">{selectedPhoto ? <img src={selectedPhoto} alt="Student" className="w-full max-h-[60vh] object-contain rounded-lg" /> : <div className="text-center text-gray-500 py-6"><Camera className="w-6 h-6 mx-auto mb-2 text-gray-400" /><p className="text-sm">No photo available</p></div>}</div></div></div>}
      </Modal>

      {/* Create Slot Modal */}
      <Modal isOpen={showAddForm} onClose={() => !creatingSlot && setShowAddForm(false)} title="Create New Attendance Slot" size="lg">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label><input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange} disabled={creatingSlot} className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${creatingSlot ? 'bg-gray-100 cursor-not-allowed' : ''}`} required /></div>
              <div><label htmlFor="shift" className="block text-sm font-medium text-gray-700 mb-1">Shift</label><select id="shift" name="shift" value={formData.shift} onChange={handleInputChange} disabled={creatingSlot} className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${creatingSlot ? 'bg-gray-100 cursor-not-allowed' : ''}`} required><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option></select></div>
              <div><label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Start Time</label><input type="time" id="startTime" name="startTime" value={formData.startTime} onChange={handleInputChange} disabled={creatingSlot} className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${creatingSlot ? 'bg-gray-100 cursor-not-allowed' : ''}`} required /></div>
              <div><label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">End Time</label><input type="time" id="endTime" name="endTime" value={formData.endTime} onChange={handleInputChange} disabled={creatingSlot} className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${creatingSlot ? 'bg-gray-100 cursor-not-allowed' : ''}`} required /></div>
            </div>
            <div className="mt-4"><label className="block text-sm font-medium text-gray-700 mb-2">Select Lectures *</label><div className="mb-3 flex flex-wrap gap-2">{formData.lectures.map(lectureId => { const lecture = lectures.find(l => l.id === lectureId); if (!lecture) return null; return <span key={lecture.id} className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">{lecture.name}{lecture.isDefault && <span className="ml-1 text-xs">(Default)</span>}<button type="button" onClick={() => handleLectureToggle(lecture.id)} className="ml-2 text-blue-600 hover:text-blue-800" disabled={creatingSlot}><X size={14} /></button></span>; })}</div><select value="" onChange={(e) => { const id = e.target.value; if (id && !formData.lectures.includes(id)) handleLectureToggle(id); }} disabled={creatingSlot} className={`w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${creatingSlot ? 'bg-gray-100 cursor-not-allowed' : ''}`}><option value="">Click to select lectures...</option>{lectures.filter(l => !formData.lectures.includes(l.id)).map((l) => <option key={l.id} value={l.id}>{l.name} {l.isDefault ? '(Default)' : ''}</option>)}</select><p className="text-xs text-gray-500 mt-1">Select one or more lectures to create attendance slots.</p></div>
            <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6"><button type="button" onClick={() => setShowAddForm(false)} disabled={creatingSlot} className={`w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${creatingSlot ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'}`}>Cancel</button><button type="submit" disabled={creatingSlot} className={`w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${creatingSlot ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'}`}>{creatingSlot ? <div className="inline-flex items-center"><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Creating...</div> : 'Create Slot'}</button></div>
          </div>
        </form>
      </Modal>

      {/* Delete Slot Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => !deletingSlot && setShowDeleteModal(false)} title="Delete Attendance Slot" size="sm">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Are you sure you want to delete this slot?</h3>
          <p className="text-sm text-gray-500">This action cannot be undone. All attendance records for this slot will be permanently removed.</p>
          {slotToDelete && <div className="mt-3 p-3 bg-gray-50 rounded-md"><div className="text-sm text-gray-700"><strong>Date:</strong> {new Date(slotToDelete.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div><div className="text-sm text-gray-700"><strong>Shift:</strong> {slotToDelete.shift.charAt(0).toUpperCase() + slotToDelete.shift.slice(1)}</div></div>}
          <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3 mt-6"><button type="button" onClick={() => { setShowDeleteModal(false); setSlotToDelete(null); }} disabled={deletingSlot} className={`w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${deletingSlot ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'}`}>Cancel</button><button type="button" onClick={async () => { if (slotToDelete?.id) await handleDeleteSlot(slotToDelete.id); }} disabled={deletingSlot} className={`w-full sm:w-auto px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white ${deletingSlot ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 cursor-pointer'}`}>{deletingSlot ? <div className="inline-flex items-center"><svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Deleting...</div> : 'Delete Slot'}</button></div>
        </div>
      </Modal>
    </div>
  );
};

export default AttendanceSlots;
