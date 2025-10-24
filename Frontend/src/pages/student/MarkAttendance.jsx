import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AlertCircle, CheckCircle, Camera, X, MapPin, Calendar, Clock } from 'lucide-react'
import { formatDate, formatTime, formatTime24h, formatDateandTime, getCurrentTimeIST, convertToIST } from '../../utils/timeUtils'
import Loader from '../../components/Loader'
import FaceDetectionCamera from '../student/FaceDetectionCamera'

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
  const videoRef = useRef()

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
      // First get location before opening camera
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          });
        });
        
        setLocation_({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: 'Location detected',
          error: null
        });
        
        // Now open camera after getting location
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        // Set the stream to the video element
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 100);
        
        setCameraStream(stream);
        setShowCamera(true);
        
      } catch (error) {
        console.error('Error getting location:', error);
        toast.error('Please enable location services to mark attendance');
        throw error;
      }
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

  // New function to handle face detection capture
  const handleFaceDetectionCapture = (canvas) => {
    if (!cameraStream) return;

    // Check if slot is selected
    if (!slotId) {
      toast.error('Please select an attendance slot first');
      return;
    }

    // Check if slot time is valid
    if (slot) {
      const currentTime = new Date();
      const currentIST = convertToIST(currentTime);
      const slotEndTime = new Date(slot.endTime);
      const slotEndIST = convertToIST(slotEndTime);
      
      if (currentIST >= slotEndIST) {
        toast.error('You got late. Slot time expired. Please mark attendance on time next time.');
        return;
      }
    }

    try {
      // Check if we have location data
      if (!location_.latitude || !location_.longitude) {
        throw new Error('Location data not available. Please get your location first.');
      }

      // Use the canvas from FaceDetectionCamera
      const ctx = canvas.getContext('2d');
      
      // Add location overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.font = '18px Arial';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      // Add location text overlay
      const locationText = `Location: ${location_.latitude}, ${location_.longitude}`;
      
      // Create a semi-transparent overlay
      ctx.fillRect(10, canvas.height - 120, canvas.width - 20, 100);
      
      // Add location and timestamp text
      ctx.fillStyle = 'white';
      ctx.fillText(locationText, 20, canvas.height - 110);
      
      // Format and display timestamp with date
      const currentDate = formatDate(new Date());
      const currentTime = formatTime24h(new Date());
      ctx.fillText(`${currentTime} ${currentDate}`, 20, canvas.height - 80);
      
      ctx.fillStyle = '#007bff';
      ctx.font = 'bold 24px "Times New Roman", Times, serif';
      ctx.fillText('ScholarSync', 20, canvas.height - 50);
      
      // Create final image with overlay
      canvas.toBlob((blob) => {
        // Add metadata to the image
        const metadata = {
          latitude: location_.latitude,
          longitude: location_.longitude,
          timestamp: formatDateandTime(new Date()).replace(' - ', ', '),
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


  const handleCheckboxChange = (e) => {
    if (!photo) {
      toast.error('Please take a photo first before confirming instructions')
      return
    }
    setHasReadInstructions(e.target.checked)
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // First check if slot is selected
    if (!slotId) {
      toast.error('Please select an attendance slot first');
      return;
    }

    // First check if slot time is still valid
    if (slot) {
      // Get current time as Date object in IST
      const currentTime = new Date();
      const currentIST = convertToIST(currentTime);
      
      // Get slot end time as Date object in IST
      const slotEndTime = new Date(slot.endTime);
      const slotEndIST = convertToIST(slotEndTime);
      
      //console.log('Submit - Current time:', currentIST);
      //console.log('Submit - Slot end time:', slotEndIST);
      //console.log('Submit - Comparison:', currentIST, '>=', slotEndIST);
    
      
      if (currentIST >= slotEndIST) {
        //console.log('Submit - Slot time expired');
        toast.error('Slot time has expired. Please mark attendance on time next time.');
        return;
      }
      //console.log('Submit - Time is valid, proceeding with submission');
    }

    // Now check other validations
    const newErrors = {};
    
    // Check photo
    if (!photo) {
      newErrors.photo = 'Photo is required';
      toast.error('Please take a selfie before submitting');
      return;
    }

    // Check location
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

      // Check again after getting location
      if (!location_.latitude || !location_.longitude) {
        newErrors.location = 'Location is required';
        toast.error('Please get your location before submitting');
        return;
      }
    }

    // Check instructions
    if (!hasReadInstructions) {
      newErrors.readInstructions = 'Please confirm that you have read the instructions';
      toast.error('Please confirm you have read the instructions');
      return;
    }

    // If we reach here, all validations have passed
    try {
      setSubmitting(true);
      
      // Create form data only if all validations pass
      const formData = new FormData();
      formData.append('slotId', slotId);
      formData.append('latitude', location_.latitude);
      formData.append('longitude', location_.longitude);
      formData.append('photo', photo, 'selfie.jpg');
      formData.append('hasReadInstructions', hasReadInstructions);
      // Use current time directly
      const currentTime = new Date();
      formData.append('currentTime', currentTime.toISOString());

      const res = await axios.post('/students/attendance', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Attendance marked successfully. Waiting for teacher approval.');
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

  if (loading) {
    return <Loader message="Loading attendance slots..." />;
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
                >
                  <option value="">Select a slot</option>
                  {activeSlots
                    .filter(slot => slot.status === 'active')
                    .map((slot) => (
                      <option key={slot._id} value={slot._id} className="text-gray-500">
                        {slot.batch?.name || 'N/A'} - {formatDate(slot.date)} -
                        {slot.shift.charAt(0).toUpperCase() + slot.shift.slice(1)} Shift -
                        {formatTime(slot.startTime)} to
                        {formatTime(slot.endTime)}
                        {slot.attendanceStatus ? ` (${slot.attendanceStatus})` : ''}
                      </option>
                    ))
                  }
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <Clock className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
            {/* Location is now automatically fetched when camera opens */}

            {/* Selfie Section with Face Detection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Take Selfie
              </label>
              <div className="camera-container">
                {showCamera ? (
                  <FaceDetectionCamera
                    show={showCamera}
                    videoRef={videoRef}
                    onCapture={handleFaceDetectionCapture}
                    onCancel={() => {
                      setShowCamera(false);
                      if (cameraStream) {
                        cameraStream.getTracks().forEach(track => track.stop());
                        setCameraStream(null);
                      }
                    }}
                  />
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
                    onChange={handleCheckboxChange}
                    disabled={!photo}
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
                      <li>Face must be centered and fully visible</li>
                      <li>Only one person should be in frame</li>
                      <li>Ensure you are in proper lighting</li>
                      <li>Wait for green "Face detected ✓" message before capturing</li>
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
                className={`w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-white transition-colors ${
                  !location_.latitude || !photo || !hasReadInstructions ? "bg-gray-400 hover:bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                } ${
                  submitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
                disabled={submitting || !location_.latitude || !photo || !hasReadInstructions}
                style={{
                  cursor: !location_.latitude || !photo || !hasReadInstructions ? 'not-allowed' : 'pointer'
                }}
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

