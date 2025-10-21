import { useState, useEffect, useRef } from 'react'
import { Camera, X } from 'lucide-react'
import { toast } from 'react-toastify'
import * as tf from '@tensorflow/tfjs'

/**
 * FaceDetectionCamera Component
 * 
 * A reusable camera component with real-time face detection
 * 
 * Props:
 * - show: boolean - Whether to show the camera
 * - onCapture: (blob) => void - Callback when photo is captured
 * - onCancel: () => void - Callback when camera is cancelled
 * - videoRef: ref - Reference to pass to parent for video element
 */
const FaceDetectionCamera = ({ show, onCapture, onCancel, videoRef }) => {
  const [detectorModel, setDetectorModel] = useState(null)
  const [modelReady, setModelReady] = useState(false)
  const [modelLoading, setModelLoading] = useState(false)
  const [realtimeValidation, setRealtimeValidation] = useState(null)
  const [canCapture, setCanCapture] = useState(false)
  const canvasRef = useRef()
  const detectionIntervalRef = useRef(null)

  // Configuration for face validation
  const DETECTION_CONFIG = {
    minFaceSize: 0.15,
    minConfidence: 0.85,
    maxFaceSize: 0.90,
    centerTolerance: 0.35,
    landmarkConfidenceThreshold: 0.5,
    minVisibleLandmarks: 4
  }

  // Load BlazeFace model on mount
  useEffect(() => {
    const loadModel = async () => {
      if (detectorModel) return // Already loaded
      
      setModelLoading(true)
      try {
        await tf.ready()
        console.log('TensorFlow.js ready')
        
        const blazeface = await import('@tensorflow-models/blazeface')
        const model = await blazeface.load()
        
        setDetectorModel(model)
        setModelReady(true)
        console.log('BlazeFace model loaded successfully')
      } catch (e) {
        console.error('Error loading face detection model:', e)
        toast.error('Failed to load face detection model. Please refresh the page.')
      }
      setModelLoading(false)
    }
    
    loadModel()
  }, [])

  // Check if RGB values represent skin tone
  const isSkinTone = (r, g, b) => {
    return (
      (r > 95 && g > 40 && b > 20 && 
       Math.max(r, g, b) - Math.min(r, g, b) > 15 && 
       Math.abs(r - g) > 15 && r > g && r > b) ||
      (r > 80 && r < 220 && g > 50 && g < 180 && b > 30 && b < 150 &&
       r > g && g > b && r - g > 10) ||
      (r > 45 && r < 120 && g > 30 && g < 100 && b > 20 && b < 80 &&
       r > g && g >= b && (r - g) > 5) ||
      (r > 100 && r < 200 && g > 80 && g < 170 && b > 60 && b < 140 &&
       Math.abs(r - g) < 30 && r > b && g > b)
    )
  }

  // Check facial landmarks visibility
  const checkLandmarksVisibility = (face, canvas) => {
    const landmarks = face.landmarks
    
    if (!landmarks || landmarks.length < 6) {
      return {
        visibleCount: 0,
        totalCount: 6,
        isObscured: true,
        message: 'Face is not fully visible'
      }
    }
    
    const ctx = canvas.getContext('2d')
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    
    let visibleLandmarks = 0
    const landmarkNames = ['Right Eye', 'Left Eye', 'Nose', 'Mouth', 'Right Ear', 'Left Ear']
    const obscuredFeatures = []
    
    landmarks.forEach((landmark, index) => {
      const x = Math.floor(landmark[0])
      const y = Math.floor(landmark[1])
      
      if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
        let skinPixelCount = 0
        let nonSkinCount = 0
        let totalSamples = 0
        const sampleRadius = 5
        
        for (let dy = -sampleRadius; dy <= sampleRadius; dy++) {
          for (let dx = -sampleRadius; dx <= sampleRadius; dx++) {
            const px = x + dx
            const py = y + dy
            
            if (px >= 0 && px < canvas.width && py >= 0 && py < canvas.height) {
              const i = (py * canvas.width + px) * 4
              const r = imageData.data[i]
              const g = imageData.data[i + 1]
              const b = imageData.data[i + 2]
              
              if (isSkinTone(r, g, b)) {
                skinPixelCount++
              } else {
                nonSkinCount++
              }
              totalSamples++
            }
          }
        }
        
        const skinRatio = skinPixelCount / totalSamples
        const nonSkinRatio = nonSkinCount / totalSamples
        
        if (skinRatio > 0.50 && nonSkinRatio < 0.60) {
          visibleLandmarks++
        } else {
          if (index < 4) {
            obscuredFeatures.push(landmarkNames[index])
          }
        }
      } else {
        if (index < 4) {
          obscuredFeatures.push(landmarkNames[index])
        }
      }
    })
    
    const criticalFeaturesVisible = visibleLandmarks >= 4 && obscuredFeatures.length <= 1
    
    return {
      visibleCount: visibleLandmarks,
      totalCount: 6,
      isObscured: !criticalFeaturesVisible,
      obscuredFeatures: obscuredFeatures,
      message: 'Face is not fully visible'
    }
  }

  const calculateFaceMetrics = (face, videoWidth, videoHeight) => {
    const topLeft = face.topLeft
    const bottomRight = face.bottomRight
    
    const faceWidth = bottomRight[0] - topLeft[0]
    const faceHeight = bottomRight[1] - topLeft[1]
    
    const relativeSizeW = faceWidth / videoWidth
    const relativeSizeH = faceHeight / videoHeight
    const relativeSize = Math.max(relativeSizeW, relativeSizeH)
    
    const faceCenterX = (topLeft[0] + bottomRight[0]) / 2
    const faceCenterY = (topLeft[1] + bottomRight[1]) / 2
    
    const frameCenterX = videoWidth / 2
    const frameCenterY = videoHeight / 2
    
    const distanceFromCenterX = Math.abs(faceCenterX - frameCenterX) / (videoWidth / 2)
    const distanceFromCenterY = Math.abs(faceCenterY - frameCenterY) / (videoHeight / 2)
    const distanceFromCenter = Math.max(distanceFromCenterX, distanceFromCenterY)
    
    return {
      relativeSize,
      distanceFromCenter,
      confidence: face.probability[0],
      centerX: faceCenterX,
      centerY: faceCenterY
    }
  }

  // Validate if face meets quality requirements
  const validateFace = (face, videoWidth, videoHeight, canvas) => {
    const metrics = calculateFaceMetrics(face, videoWidth, videoHeight)
    const landmarkCheck = checkLandmarksVisibility(face, canvas)
    
    const issues = []
    
    if (landmarkCheck.isObscured) {
      issues.push('Face is not fully visible')
    }
    
    if (metrics.confidence < DETECTION_CONFIG.minConfidence) {
      issues.push('Face is not fully visible')
    }
    
    if (metrics.relativeSize < DETECTION_CONFIG.minFaceSize) {
      issues.push('Move closer to camera')
    }
    
    if (metrics.relativeSize > DETECTION_CONFIG.maxFaceSize) {
      issues.push('Move away from camera')
    }
    
    if (metrics.distanceFromCenter > DETECTION_CONFIG.centerTolerance) {
      issues.push('Center your face')
    }
    
    return {
      isValid: issues.length === 0,
      issues,
      metrics,
      landmarks: landmarkCheck
    }
  }

  // Detect faces using BlazeFace model
  const detectFaces = async (videoElement, canvas) => {
    if (!detectorModel) {
      throw new Error('Model not loaded')
    }
    
    try {
      const predictions = await detectorModel.estimateFaces(videoElement, false)
      
      const videoWidth = videoElement.videoWidth || 640
      const videoHeight = videoElement.videoHeight || 480
      
      const validatedFaces = predictions.map(face => ({
        face,
        validation: validateFace(face, videoWidth, videoHeight, canvas)
      }))
      
      return validatedFaces
    } catch (e) {
      console.error('Face detection error:', e)
      throw e
    }
  }

  // Real-time face detection loop
  useEffect(() => {
    if (!show || !modelReady || !detectorModel) {
      return
    }

    const runRealtimeDetection = async () => {
      const video = videoRef?.current
      const canvas = canvasRef.current

      if (!video || !canvas || video.readyState !== 4) {
        return
      }

      try {
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480
        
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const validatedFaces = await detectFaces(video, canvas)
        
        const validFaces = validatedFaces.filter(vf => vf.validation.isValid)
        const allFaces = validatedFaces.length
        const validCount = validFaces.length
        
        let result
        
        if (allFaces === 0) {
          result = { 
            type: 'no_face',
            isValid: false,
            message: 'No face detected',
            color: '#f59e0b'
          }
        } else if (allFaces > 1) {
          result = { 
            type: 'multiple_faces',
            isValid: false,
            message: 'Multiple faces detected',
            color: '#f59e0b'
          }
        } else if (validCount === 1) {
          const metrics = validatedFaces[0].validation.metrics
          result = { 
            type: 'single_face',
            isValid: true,
            message: 'Face detected ✓',
            color: '#10b981',
            confidence: metrics.confidence
          }
        } else {
          const issues = validatedFaces[0].validation.issues
          result = { 
            type: 'invalid_face',
            isValid: false,
            message: issues[0] || 'Face is not fully visible',
            color: '#f59e0b'
          }
        }
        
        setRealtimeValidation(result)
        setCanCapture(result.isValid)
        
      } catch (e) {
        console.error('Real-time detection error:', e)
        setRealtimeValidation({
          type: 'error',
          isValid: false,
          message: 'Detection error',
          color: '#ef4444'
        })
        setCanCapture(false)
      }
    }

    detectionIntervalRef.current = setInterval(runRealtimeDetection, 500)

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
    }
  }, [show, modelReady, detectorModel, videoRef])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
    }
  }, [])

  const handleCapture = () => {
    if (canCapture && onCapture) {
      onCapture(canvasRef.current)
    }
  }

  if (!show) return null

  return (
    <div className="bg-black rounded-lg overflow-hidden">
      <div
        className="relative"
        style={{ width: "100%", maxWidth: "640px", margin: "0 auto" }}
      >
        <video
          ref={videoRef}
          id="cameraVideo"
          autoPlay
          playsInline
          muted
          className="w-full h-auto transform scale-x-[-1]"
          style={{ maxHeight: "480px" }}
        />
        {/* Circular guide overlay */}
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: "40%",
            paddingBottom: "50%",
            border: `3px dashed ${canCapture ? "#10b981" : "#f59e0b"}`,
            borderRadius: "50%",
            transition: "border-color 0.3s ease",
          }}
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      {/* Model Loading Status */}
      {modelLoading && (
        <div className="px-4 py-3 text-center font-medium bg-blue-100 text-blue-800">
          Loading ...
        </div>
      )}

      {/* Validation Status */}
      {!modelLoading && modelReady && realtimeValidation && (
        <div
          className="px-4 py-3 text-center font-medium transition-all duration-300"
          style={{
            backgroundColor: realtimeValidation.color + "20",
            color: realtimeValidation.color,
          }}
        >
          {realtimeValidation.message}
        </div>
      )}

      <div className="bg-gray-800 p-4 flex justify-center space-x-4">
        <button
          type="button"
          className={`flex items-center px-4 py-2 rounded-md shadow-sm transition-colors ${
            canCapture && modelReady
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-gray-600 text-gray-300 cursor-not-allowed"
          }`}
          onClick={handleCapture}
          disabled={!canCapture || !modelReady}
        >
          <Camera className="h-5 w-5 mr-2" />
          {!modelReady
            ? "Loading Model..."
            : canCapture
            ? "Take Selfie"
            : "Position Face"}
        </button>
        <button
          type="button"
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md shadow-sm hover:bg-gray-700 transition-colors"
          onClick={onCancel}
        >
          <X className="h-5 w-5 mr-2" />
          Cancel
        </button>
      </div>
    </div>
  );
}

export default FaceDetectionCamera