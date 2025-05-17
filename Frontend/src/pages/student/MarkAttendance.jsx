import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AlertCircle, CheckCircle } from 'lucide-react'

const MarkAttendance = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [slotId, setSlotId] = useState('')
  const [slot, setSlot] = useState(null)
  const [activeSlots, setActiveSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [photo, setPhoto] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [location_, setLocation_] = useState({
    latitude: null,
    longitude: null,
    address: '',
    error: null
  })
  const [submitting, setSubmitting] = useState(false)
  const [hasReadInstructions, setHasReadInstructions] = useState(false)
  const [errors, setErrors] = useState({})

  // Format UTC time to 24-hour format in IST
  const formatTime24h = (utcTime) => {
    if (!utcTime) return "";
    const d = new Date(utcTime);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata"
    });
  };

  // Format date as 'Mon, 15 May' (IST)
  const formatDateDisplay = (date) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
      timeZone: "Asia/Kolkata"
    });
  };

  // Get current time in IST
  const getCurrentTimeIST = () => {
    return new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata"
    });
  };

  // Get current date in IST
  const getCurrentDateIST = () => {
    return new Date().toLocaleDateString("en-US", {
      timeZone: "Asia/Kolkata"
    });
  };

  useEffect(() => {
    // Get slotId from URL query params
    const params = new URLSearchParams(location.search)
    const slotIdParam = params.get('slotId')
    
    if (slotIdParam) {
      setSlotId(slotIdParam)
    }
    
    fetchActiveSlots()
  }, [location])

  useEffect(() => {
    if (slotId) {
      fetchSlotDetails()
    }
  }, [slotId])

  // Update slot status based on current time
  useEffect(() => {
    if (slot) {
      const now = new Date();
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);
      
      if (now < startTime) {
        setSlot(prev => ({
          ...prev,
          status: 'upcoming'
        }));
      } else if (now > endTime) {
        setSlot(prev => ({
          ...prev,
          status: 'completed'
        }));
      } else {
        setSlot(prev => ({
          ...prev,
          status: 'active'
        }));
      }
    }
  }, [slot]);

  const fetchActiveSlots = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Authentication token not found')
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }

      const res = await axios.get('/students/attendance-slots', config)
      setActiveSlots(res.data.data || [])
      
      // If no slotId is set and there are active slots, set the first one
      if (!slotId && res.data.data && res.data.data.length > 0) {
        setSlotId(res.data.data[0]._id)
      }
    } catch (error) {
      console.error('Error fetching active slots:', error)
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.')
        navigate('/login')
      } else {
        toast.error('Failed to load active attendance slots')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchSlotDetails = async () => {
    try {
      // Find the slot in activeSlots
      const foundSlot = activeSlots.find(s => s._id === slotId)
      if (foundSlot) {
        setSlot(foundSlot)
      }
    } catch (error) {
      console.error('Error fetching slot details:', error)
      toast.error('Failed to load slot details')
    }
  }

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }

      setPhoto(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocation_({
        ...location_,
        error: 'Geolocation is not supported by your browser'
      })
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation_({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: 'Location detected',
          error: null
        })
      },
      (error) => {
        setLocation_({
          ...location_,
          error: `Error getting location: ${error.message}`
        })
      }
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    const newErrors = {};
    if (!photo) newErrors.photo = 'Photo is required';
    if (!location_.latitude) newErrors.location = 'Location is required';
    if (!hasReadInstructions) newErrors.readInstructions = 'Please confirm that you have read the instructions';

    // Check slot status
    if (slot) {
      // For upcoming slots
      if (slot.status === 'upcoming') {
        newErrors.slotTime = 'This slot is not yet active';
        toast.warning(`Attendance slot will be available from ${formatTime24h(slot.startTime)}`);
      }
      // For completed slots
      else if (slot.status === 'completed') {
        newErrors.slotTime = 'This slot has already ended';
        toast.error(`Attendance slot has expired. It was available until ${formatTime24h(slot.endTime)}`);
      }
      // For active slots, check time window
      else if (slot.status === 'active') {
        const currentTime = new Date();
        const startTime = new Date(slot.startTime);
        const endTime = new Date(slot.endTime);
        
        if (currentTime < startTime || currentTime > endTime) {
          newErrors.slotTime = 'Outside active time window';
          toast.error('Attendance can only be marked during the active time window');
        }
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true)
      
      // Create form data
      const formData = new FormData()
      formData.append('slotId', slotId)
      formData.append('latitude', location_.latitude)
      formData.append('longitude', location_.longitude)
      formData.append('address', location_.address)
      formData.append('photo', photo)
      formData.append('markedAt', getCurrentTimeIST())
      
      const res = await axios.post('/students/attendance', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      if (res.data.success) {
        toast.success('Attendance marked successfully')
        navigate('/student')
      }
    } catch (error) {
      console.error('Error marking attendance:', error)
      toast.error(error.response?.data?.message || 'Failed to mark attendance')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">Loading attendance slots...</p>
      </div>
    )
  }

  if (activeSlots.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 bg-white shadow-md rounded-lg my-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-2">Mark Attendance</h1>
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <p className="text-gray-700 text-lg mb-4">No active attendance slots available at the moment.</p>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition duration-200 ease-in-out"
            onClick={() => navigate('/student')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 bg-white shadow-lg rounded-lg my-6 md:my-8">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 border-b pb-3">Mark Attendance</h1>
      
      <div className="attendance-form-container">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="form-group">
            <label htmlFor="slotId" className="block text-sm font-medium text-gray-700 mb-1">
              Select Attendance Slot
            </label>
            <select
              id="slotId"
              value={slotId}
              onChange={(e) => setSlotId(e.target.value)}
              required
              disabled={photo !== null}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a slot</option>
              {activeSlots.map((slot) => (
                <option key={slot._id} value={slot._id}>
                  {slot.shift} - {new Date(slot.date).toLocaleDateString()} ({new Date(slot.startTime).toLocaleTimeString()} - {new Date(slot.endTime).toLocaleTimeString()})
                </option>
              ))}
            </select>
          </div>
          
          {slot && (
            <div className="mt-4">
              {/* Display slot status */}
              <div className="mb-4">
                {slot.status === 'upcoming' && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
                    <AlertCircle className="h-5 w-5 text-blue-700 inline-block mr-2" />
                    <span className="text-blue-700">
                      This slot is not yet active. It will start at {formatTime24h(slot.startTime)}
                    </span>
                  </div>
                )}
                {slot.status === 'active' && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
                    <CheckCircle className="h-5 w-5 text-green-700 inline-block mr-2" />
                    <span className="text-green-700">Attendance slot is currently active</span>
                  </div>
                )}
                {slot.status === 'completed' && (
                  <div className="bg-gray-50 border-l-4 border-gray-500 p-4 rounded-md">
                    <AlertCircle className="h-5 w-5 text-gray-700 inline-block mr-2" />
                    <span className="text-gray-700">This slot has ended</span>
                  </div>
                )}
              </div>

              {/* Form for active slots only */}
              {slot.status === 'active' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="form-group">
                    <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Photo
                    </label>
                    <input
                      type="file"
                      id="photo"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="mt-2 max-w-[200px] max-h-[200px]"
                      />
                    )}
                    {errors.photo && (
                      <p className="mt-1 text-sm text-red-600">{errors.photo}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <button
                      type="button"
                      onClick={getLocation}
                      disabled={submitting}
                      className={`w-full px-4 py-2 rounded-md font-medium shadow-sm ${
                        location_.latitude 
                          ? 'bg-green-500 hover:bg-green-600 text-white' 
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      } transition duration-200 ease-in-out flex items-center justify-center`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {location_.latitude ? 'Location Detected' : 'Get Location'}
                    </button>
                    {location_.latitude && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-700 flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Location successfully captured
                        </p>
                      </div>
                    )}
                    {location_.error && (
                      <p className="mt-2 text-sm text-red-600 p-2 bg-red-50 border border-red-200 rounded-md">
                        {location_.error}
                      </p>
                    )}
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="read-instructions"
                        name="read-instructions"
                        type="checkbox"
                        checked={hasReadInstructions}
                        onChange={(e) => setHasReadInstructions(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="read-instructions" className="font-medium text-gray-700">
                        I have read and understood all the instructions above
                      </label>
                      {errors.readInstructions && (
                        <p className="mt-1 text-sm text-red-600">{errors.readInstructions}</p>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`w-full px-6 py-3 text-white font-medium rounded-md shadow-md ${
                      !photo || !location_.latitude || !hasReadInstructions || submitting
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } transition duration-200 ease-in-out flex items-center justify-center`}
                    disabled={!photo || !location_.latitude || !hasReadInstructions || submitting}
                  >
                    {submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Marking Attendance...
                      </>
                    ) : (
                      'Mark Attendance'
                    )}
                  </button>
                </form>
              )}

              {/* Display upcoming slots */}
              {slot.status === 'upcoming' && (
                <div className="text-center py-4">
                  <p className="text-gray-600">
                    This slot will start at {formatTime24h(slot.startTime)}. You can mark attendance once it becomes active.
                  </p>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default MarkAttendance;