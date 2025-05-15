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

  const fetchActiveSlots = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/students/attendance-slots')
      setActiveSlots(res.data.data || [])
      
      // If no slotId is set and there are active slots, set the first one
      if (!slotId && res.data.data && res.data.data.length > 0) {
        setSlotId(res.data.data[0]._id)
      }
    } catch (error) {
      console.error('Error fetching active slots:', error)
      toast.error('Failed to load active attendance slots')
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
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Selected Slot Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <p className="text-gray-700"><span className="font-medium">Shift:</span> {slot.shift}</p>
                <p className="text-gray-700"><span className="font-medium">Date:</span> {new Date(slot.date).toLocaleDateString()}</p>
                <p className="text-gray-700"><span className="font-medium">Time:</span> {new Date(slot.startTime).toLocaleTimeString()} - {new Date(slot.endTime).toLocaleTimeString()}</p>
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 rounded">
              <div className="flex">
                <AlertCircle className="flex-shrink-0 h-5 w-5 text-red-700" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Important Photo Upload Instructions
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>Only upload selfies taken in Masai office</li>
                      <li>Photo must be taken with timestamp camera</li>
                      <li>Ensure your face is clearly visible</li>
                      <li>Strict disciplinary action will be taken for non-compliance</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-700">
              Upload Photo
            </label>
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="flex-1">
                <div className={`border-2 border-dashed rounded-lg p-4 text-center ${previewUrl ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                  <input
                    type="file"
                    id="photo"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    required
                    disabled={submitting}
                    className="hidden"
                  />
                  <label 
                    htmlFor="photo" 
                    className="cursor-pointer flex flex-col items-center justify-center"
                  >
                    <div className="w-12 h-12 mb-2 rounded-full bg-blue-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-600">
                      {previewUrl ? 'Change photo' : 'Click to upload photo'}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      (Max size: 5MB)
                    </span>
                  </label>
                </div>
              </div>
              {previewUrl && (
                <div className="w-full md:w-40 h-40 relative">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover rounded-lg shadow-md" 
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPhoto(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <button
              type="button"
              onClick={getLocation}
              disabled={submitting}
              className={`w-full md:w-auto px-4 py-2 rounded-md font-medium shadow-sm ${
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
      </div>
    </div>
  )
}

export default MarkAttendance