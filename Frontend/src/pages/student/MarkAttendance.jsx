import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AlertCircle, CheckCircle, Camera, X, MapPin, Calendar, Clock } from 'lucide-react'

const MarkAttendance = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [slotId, setSlotId] = useState('')
  const [slot, setSlot] = useState(null)
  const [activeSlots, setActiveSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [photo, setPhoto] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [cameraStream, setCameraStream] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
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

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      // Set the stream to the video element
      setTimeout(() => {
        const videoElement = document.getElementById('cameraVideo');
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      }, 100);
      
      setCameraStream(stream);
      setShowCamera(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      if (err.name === 'NotAllowedError') {
        toast.error('Camera permission denied. Please allow camera access in your browser settings.');
      } else {
        toast.error('Failed to access camera. Please check camera permissions.');
      }
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocation_({
        ...location_,
        error: 'Geolocation is not supported by your browser'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation_({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: 'Location detected',
          error: null
        });
      },
      (error) => {
        setLocation_({
          ...location_,
          error: `Error getting location: ${error.message}`
        });
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 
      }
    );
  };


  const capturePhoto = async () => {
    if (!cameraStream) return;

    // Check if slot is selected
    if (!slotId) {
      toast.error('Please select an attendance slot first');
      return;
    }

    // Check if slot time is valid
    if (slot) {
      const currentTime = new Date();
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);
      
      if (currentTime < startTime) {
        toast.warning(`Attendance slot will be active from ${formatTime24h(startTime)}`);
        return;
      } else if (currentTime > endTime) {
        toast.error(`Attendance slot expired at ${formatTime24h(endTime)}`);
        return;
      }
    }

    try {
      // First get location if not available
      if (!location_.latitude || !location_.longitude) {
        try {
          const location = await getLocation();
          if (!location.latitude || !location.longitude) {
            throw new Error('Failed to get location data');
          }
        } catch (error) {
          toast.error(error.message);
          return;
        }
      }

      // Check if we have location data
      if (!location_.latitude || !location_.longitude) {
        throw new Error('Location data not available. Please get your location first.');
      }

      const video = document.getElementById('cameraVideo');
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      
      // Draw the video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Add location overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.font = '18px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      // Add location text overlay
      const locationText = `Location: ${location_.latitude}, ${location_.longitude}`;
      const timestamp = new Date().toLocaleString();
      
      // Create a semi-transparent overlay
      ctx.fillRect(10, canvas.height - 120, canvas.width - 20, 100);
      
      // Add location and timestamp text
      ctx.fillStyle = 'white';
      ctx.fillText(locationText, 20, canvas.height - 110);
      ctx.fillText(timestamp, 20, canvas.height - 80);
      
      // Add Masai logo or watermark
      ctx.fillStyle = '#007bff';
      ctx.font = 'bold 24px Arial';
      ctx.fillText('Masai School', 20, canvas.height - 50);
      
      // Create final image with overlay
      canvas.toBlob((blob) => {
        // Add metadata to the image
        const metadata = {
          latitude: location_.latitude,
          longitude: location_.longitude,
          timestamp: new Date().toISOString(),
          locationText
        };
        
        // Create a new blob with metadata
        const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
        const photoBlob = new Blob([blob, metadataBlob], { type: 'image/jpeg' });
        
        setPhoto(photoBlob);
        setPreviewUrl(URL.createObjectURL(photoBlob));
        setShowCamera(false);
        
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
        }
      }, 'image/jpeg', 0.8);
    } catch (error) {
      console.error('Error capturing photo:', error);
      toast.error(error.message || 'Failed to capture photo. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // First get location if not available
    if (!location_.latitude || !location_.longitude) {
      try {
        const location = await getLocation();
        if (!location.latitude || !location.longitude) {
          throw new Error('Failed to get location data');
        }
      } catch (error) {
        toast.error(error.message);
        return;
      }
    }

    // Validation
    const newErrors = {};
    if (!photo) {
      newErrors.photo = 'Photo is required';
      toast.error('Please take a selfie before submitting');
    }
    if (!location_.latitude) {
      newErrors.location = 'Location is required';
      toast.error('Please get your location before submitting');
    }
    if (!hasReadInstructions) {
      newErrors.readInstructions = 'Please confirm that you have read the instructions';
      toast.error('Please confirm you have read the instructions');
    }

    // Check if slot time is valid
    if (slot) {
      const currentTime = new Date();
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);
      
      if (currentTime < startTime) {
        newErrors.slotTime = `Attendance slot will be active from ${formatTime24h(startTime)}`;
        toast.warning(newErrors.slotTime);
        return; // Return early if slot hasn't started
      } else if (currentTime > endTime) {
        newErrors.slotTime = `Attendance slot expired at ${formatTime24h(endTime)}`;
        toast.error(newErrors.slotTime);
        return; // Return early if slot has expired
      }
    }
    
    // If we reach here, slot time is valid
    // Create form data only if all validations pass
    const formData = new FormData();
    formData.append('slotId', slotId);
    formData.append('latitude', location_.latitude);
    formData.append('longitude', location_.longitude);
    formData.append('photo', photo, 'selfie.jpg');
    formData.append('hasReadInstructions', hasReadInstructions);

    try {
      setSubmitting(true);

      const res = await axios.post('/students/attendance', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Attendance marked successfully!');
      navigate('/student');
    } catch (error) {
      console.error('Error marking attendance:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to mark attendance');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (activeSlots.length === 0) {
    return (
      <div className="max-w-3xl mx-auto mt-8 px-4">
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                No active attendance slots available at the moment.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
          <h3 className="text-xl font-bold text-white">Mark Attendance</h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {/* Attendance Slot Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="attendance-slot">
                Select Attendance Slot
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Calendar className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="attendance-slot"
                  className="block w-full pl-10 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md shadow-sm"
                  value={slotId}
                  onChange={(e) => setSlotId(e.target.value)}
                  required
                >
                  <option value="">Select a slot</option>
                  {activeSlots.map((slot) => (
                    <option key={slot._id} value={slot._id}>
                      {formatDateDisplay(slot.date)} - {formatTime24h(slot.startTime)} to {formatTime24h(slot.endTime)}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
                        {/* Location Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <button
                type="button"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                onClick={getLocation}
              >
                <MapPin className="h-5 w-5 mr-2" />
                Get Current Location
              </button>
              
              {location_.latitude && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">Location Detected</h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Latitude: {location_.latitude}</p>
                        <p>Longitude: {location_.longitude}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {location_.error && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Location Error</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>{location_.error}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {errors.location && (
                <p className="mt-2 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            {/* Selfie Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Take Selfie
              </label>
              <div className="camera-container">
                {showCamera ? (
                  <div className="bg-black rounded-lg overflow-hidden">
                    <video
                      id="cameraVideo"
                      autoPlay
                      playsInline
                      className="w-full h-auto transform scale-x-[-1] max-w-full rounded-lg"
                    />
                    <div className="bg-gray-800 p-4 flex justify-center space-x-4">
                      <button
                        type="button"
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        onClick={capturePhoto}
                      >
                        <Camera className="h-5 w-5 mr-2" />
                        Take Selfie
                      </button>
                      <button
                        type="button"
                        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                        onClick={() => {
                          setShowCamera(false);
                          if (cameraStream) {
                            cameraStream.getTracks().forEach(track => track.stop());
                            setCameraStream(null);
                          }
                        }}
                      >
                        <X className="h-5 w-5 mr-2" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                      onClick={startCamera}
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Open Camera
                    </button>
                    
                    {previewUrl && (
                      <div className="mt-4 bg-gray-100 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Preview:</p>
                        <img
                          src={previewUrl}
                          alt="Selfie Preview"
                          className="max-w-xs mx-auto rounded-md shadow-md"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
              {errors.photo && (
                <p className="mt-2 text-sm text-red-600">{errors.photo}</p>
              )}
            </div>



            {/* Instructions Confirmation */}
            <div className="mb-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="readInstructions"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    checked={hasReadInstructions}
                    onChange={(e) => setHasReadInstructions(e.target.checked)}
                    required
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="readInstructions" className="font-medium text-gray-700">
                    I have read and understood the attendance instructions
                  </label>
                </div>
              </div>
              {errors.readInstructions && (
                <p className="mt-2 text-sm text-red-600">{errors.readInstructions}</p>
              )}
            </div>

            {/* Important Instructions */}
            <div className="mb-6 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-amber-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800">
                    Important Photo Upload Instructions
                  </h3>
                  <div className="mt-2 text-sm text-amber-700">
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

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                className={`w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${
                  submitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  "Mark Attendance"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MarkAttendance;