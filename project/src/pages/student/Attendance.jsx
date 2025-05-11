import { useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'
import { FiCamera, FiMap, FiCheck, FiX, FiAlertCircle, FiRefreshCw } from 'react-icons/fi'
import { studentApi } from '../../services/api'
import Webcam from 'react-webcam'
import { toast } from 'react-toastify'

export default function StudentAttendance() {
  const [activeSlots, setActiveSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [photo, setPhoto] = useState(null)
  const [location, setLocation] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError, setLocationError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const webcamRef = useRef(null)

  // Fetch active attendance slots
  const fetchActiveSlots = async () => {
    try {
      setLoading(true)
      const response = await studentApi.getActiveAttendanceSlots()
      setActiveSlots(response.data.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching active slots:', err)
      setError('Failed to load active attendance slots. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActiveSlots()
  }, [])

  // Get user location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      return
    }
    
    setLocationLoading(true)
    setLocationError(null)
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          address: 'Current location' // This would be filled by reverse geocoding in a real app
        })
        setLocationLoading(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        setLocationError(
          error.code === 1
            ? 'Please allow location access to mark attendance'
            : 'Unable to get your location. Please try again.'
        )
        setLocationLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  // Handle slot selection
  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot)
    getUserLocation()
  }

  // Handle camera toggle
  const handleToggleCamera = () => {
    setCameraActive(!cameraActive)
    setPhoto(null)
  }

  // Capture photo
  const handleCapturePhoto = () => {
    setCapturing(true)
    setTimeout(() => {
      const imageSrc = webcamRef.current.getScreenshot()
      setPhoto(imageSrc)
      setCameraActive(false)
      setCapturing(false)
    }, 500)
  }

  // Clear photo and restart camera
  const handleRetakePhoto = () => {
    setPhoto(null)
    setCameraActive(true)
  }

  // Convert dataURL to file
  const dataURLtoFile = (dataurl, filename) => {
    const arr = dataurl.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    
    while(n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    
    return new File([u8arr], filename, { type: mime })
  }

  // Submit attendance
  const handleSubmitAttendance = async () => {
    if (!selectedSlot || !photo || !location) {
      toast.error('Please complete all the required fields')
      return
    }
    
    setSubmitting(true)
    
    try {
      // Create FormData object
      const formData = new FormData()
      formData.append('slotId', selectedSlot._id)
      formData.append('latitude', location.latitude)
      formData.append('longitude', location.longitude)
      formData.append('address', location.address)
      
      // Convert base64 photo to file and append to formData
      const photoFile = dataURLtoFile(photo, 'attendance.jpg')
      formData.append('photo', photoFile)
      
      const response = await studentApi.markAttendance(formData)
      
      if (response.data.success) {
        toast.success('Attendance marked successfully')
        
        // Reset state
        setSelectedSlot(null)
        setLocation(null)
        setPhoto(null)
        setCameraActive(false)
        
        // Refresh active slots
        fetchActiveSlots()
      }
    } catch (err) {
      console.error('Error marking attendance:', err)
      toast.error('Failed to mark attendance. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Reset the form
  const handleReset = () => {
    setSelectedSlot(null)
    setLocation(null)
    setPhoto(null)
    setCameraActive(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Mark Attendance</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Mark your attendance for today's sessions
          </p>
        </div>
        
        <button
          onClick={fetchActiveSlots}
          className="mt-4 sm:mt-0 btn btn-outline flex items-center"
        >
          <FiRefreshCw className="mr-2" />
          Refresh Slots
        </button>
      </div>
      
      {selectedSlot ? (
        // Attendance marking form
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Mark Attendance for {selectedSlot.shift.charAt(0).toUpperCase() + selectedSlot.shift.slice(1)} Shift
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Slot details */}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date</p>
                <p className="text-base text-gray-900 dark:text-white">
                  {format(new Date(selectedSlot.date), 'MMMM d, yyyy')}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Time</p>
                <p className="text-base text-gray-900 dark:text-white">
                  {format(new Date(selectedSlot.startTime), 'h:mm a')} - {format(new Date(selectedSlot.endTime), 'h:mm a')}
                </p>
              </div>
              
              {/* Location information */}
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                  <FiMap className="mr-1" /> Location
                </p>
                
                {locationLoading ? (
                  <div className="flex items-center mt-1 text-gray-600 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
                    Getting your location...
                  </div>
                ) : locationError ? (
                  <div className="mt-1 text-red-600 dark:text-red-400 text-sm flex items-start">
                    <FiAlertCircle className="h-4 w-4 mr-1 mt-0.5" />
                    <span>{locationError}</span>
                  </div>
                ) : location ? (
                  <div className="mt-1">
                    <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
                      <FiCheck className="h-4 w-4 mr-1" />
                      Location captured successfully
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={getUserLocation}
                    className="mt-1 inline-flex items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    <FiMap className="mr-1" />
                    Get my location
                  </button>
                )}
              </div>
            </div>
            
            {/* Photo capture */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
                <FiCamera className="mr-1" /> Photo Verification
              </p>
              
              {photo ? (
                // Show captured photo
                <div className="space-y-2">
                  <div className="relative w-full h-48 md:h-64 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <img src={photo} alt="Captured" className="w-full h-full object-cover" />
                  </div>
                  <button
                    onClick={handleRetakePhoto}
                    className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Retake photo
                  </button>
                </div>
              ) : cameraActive ? (
                // Show webcam
                <div className="space-y-2">
                  <div className="relative w-full h-48 md:h-64 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                    <Webcam
                      audio={false}
                      ref={webcamRef}
                      screenshotFormat="image/jpeg"
                      videoConstraints={{
                        facingMode: "user"
                      }}
                      className="w-full h-full object-cover"
                    />
                    {capturing && (
                      <div className="absolute inset-0 bg-white opacity-80 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <button
                      onClick={() => setCameraActive(false)}
                      className="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCapturePhoto}
                      disabled={capturing}
                      className="text-sm bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-800 transition-colors"
                    >
                      Capture
                    </button>
                  </div>
                </div>
              ) : (
                // Show camera button
                <button
                  onClick={handleToggleCamera}
                  className="w-full h-48 md:h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:text-primary-600 hover:border-primary-600 dark:hover:text-primary-400 dark:hover:border-primary-400 transition-colors"
                >
                  <FiCamera className="text-3xl mb-2" />
                  <span>Click to take a photo</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Submit buttons */}
          <div className="mt-8 flex justify-end space-x-4">
            <button
              onClick={handleReset}
              className="btn btn-outline"
              disabled={submitting}
            >
              Cancel
            </button>
            
            <button
              onClick={handleSubmitAttendance}
              className="btn btn-primary"
              disabled={!photo || !location || submitting}
            >
              {submitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : 'Mark Attendance'}
            </button>
          </div>
        </div>
      ) : (
        // Available slots list
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Available Attendance Slots
            </h2>
          </div>
          
          {activeSlots.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {activeSlots.map((slot) => (
                <div key={slot._id} className="p-6">
                  <div className="flex flex-wrap justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white capitalize">
                        {slot.shift} Shift
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(slot.date), 'MMMM d, yyyy')}
                      </p>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(slot.startTime), 'h:mm a')} - {format(new Date(slot.endTime), 'h:mm a')}
                      </p>
                    </div>
                    
                    <div className="mt-4 sm:mt-0">
                      <button
                        onClick={() => handleSelectSlot(slot)}
                        className="btn btn-primary"
                      >
                        Mark Attendance
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <p>No active attendance slots available right now.</p>
              <p className="mt-1 text-sm">Check back later or contact your administrator.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}