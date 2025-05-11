import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'

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
    
    if (!photo) {
      toast.error('Please upload your photo')
      return
    }
    
    if (!location_.latitude || !location_.longitude) {
      toast.error('Please allow location access')
      return
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
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading attendance slots...</p>
      </div>
    )
  }

  if (activeSlots.length === 0) {
    return (
      <div className="mark-attendance">
        <h1>Mark Attendance</h1>
        <div className="no-slots-message">
          <p>No active attendance slots available at the moment.</p>
          <button 
            className="back-button"
            onClick={() => navigate('/student')}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mark-attendance">
      <h1>Mark Attendance</h1>
      
      <div className="attendance-form-container">
        <form onSubmit={handleSubmit} className="attendance-form">
          <div className="form-group">
            <label htmlFor="slotId">Select Attendance Slot</label>
            <select
              id="slotId"
              value={slotId}
              onChange={(e) => setSlotId(e.target.value)}
              required
              disabled={photo !== null}
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
            <div className="slot-details">
              <h3>Selected Slot Details</h3>
              <p><strong>Shift:</strong> {slot.shift}</p>
              <p><strong>Date:</strong> {new Date(slot.date).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {new Date(slot.startTime).toLocaleTimeString()} - {new Date(slot.endTime).toLocaleTimeString()}</p>
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="photo">Upload Photo</label>
            <input
              type="file"
              id="photo"
              accept="image/*"
              onChange={handlePhotoUpload}
              required
              disabled={submitting}
            />
            {previewUrl && (
              <div className="photo-preview">
                <img src={previewUrl} alt="Preview" />
              </div>
            )}
          </div>
          
          <div className="form-group">
<button
  type="button"
  onClick={getLocation}
  disabled={submitting}
>
  {location_.latitude ? 'Location Detected' : 'Get Location'}
</button>
            {location_.error && (
              <p className="error-message">{location_.error}</p>
            )}
          </div>
          
          <button
            type="submit"
            className="submit-button"
            disabled={!photo || !location_.latitude || submitting}
          >
            {submitting ? 'Marking Attendance...' : 'Mark Attendance'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default MarkAttendance