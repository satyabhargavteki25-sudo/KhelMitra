/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Dumbbell, Play, Square, Save, CheckCircle, Volume2, ShieldAlert, Sparkles, AlertCircle } from 'lucide-react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { SavedScore, ExerciseType, JointPoint } from '../types';
import { calculateAngle, getFormScore } from '../utils/angleCalc';
import { processElbowCoaching, speakHindiFeedback } from '../utils/speechHelper';

export default function PoseCameraView() {
  // Navigation & session state
  const [exercise, setExercise] = useState<ExerciseType>('bicep_curl');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [repCount, setRepCount] = useState(0);
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Live posture state
  const [angles, setAngles] = useState({ leftElbow: 0, rightElbow: 0, rightKnee: 0 });
  const [formScore, setFormScore] = useState(0);
  const [coachingFeedback, setCoachingFeedback] = useState({ text: 'खड़े हो जाएँ (Prepare)', category: 'idle' });

  // Camera & MediaPipe loading state
  const [cameraMode, setCameraMode] = useState<'webcam' | 'simulated'>('simulated');
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [cameraPermissionError, setCameraPermissionError] = useState(false);

  // References
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastRepStateRef = useRef<'extended' | 'flexed' | 'idle'>('idle');

  // Trigger simulated animation values
  const simAngleRef = useRef(170);
  const simDirectionRef = useRef(-1); // -1 = bending, 1 = straightening

  // Initialize Speech
  useEffect(() => {
    // Speak a polite Hindi greeting when the view loads
    speakHindiFeedback('खेल मित्र में आपका स्वागत है। अभ्यास शुरू करने के लिए स्टार्ट दबायें।', true);
  }, []);

  // --- Toggle Camera Mode and Handle Webcam Startup ---
  useEffect(() => {
    if (cameraMode === 'webcam') {
      startWebcamMode();
    } else {
      stopWebcam();
      // Start Simulated animation loop
      requestRef.current = requestAnimationFrame(runSimulatedLoop);
    }

    return () => {
      stopWebcam();
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [cameraMode, exercise, isSessionActive]);

  const startWebcamMode = async () => {
    setIsLoadingModel(true);
    setModelError(null);
    setCameraPermissionError(false);

    try {
      // 1. Get user webcam permission & stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // 2. Load MediaPipe Pose Landmarker
      if (!landmarkerRef.current) {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );

        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1
        });
        landmarkerRef.current = landmarker;
      }

      setIsLoadingModel(false);
      // Start tracking loop
      requestRef.current = requestAnimationFrame(runWebcamTrackingLoop);

    } catch (err: any) {
      console.error("Camera mode error:", err);
      setIsLoadingModel(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraPermissionError(true);
      } else {
        setModelError(err.message || "Failed to load MediaPipe Pose model.");
      }
      // Fallback to simulated mode
      setCameraMode('simulated');
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
  };

  // --- WEBCAM TRACKING LOOP ---
  const runWebcamTrackingLoop = () => {
    if (cameraMode !== 'webcam' || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (video.readyState === video.HAVE_ENOUGH_DATA && landmarkerRef.current && ctx) {
      // Fit canvas size to matches videoaspect
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw mirrored video frame
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Process frame with MediaPipe
      const startTimeMs = performance.now();
      const results = landmarkerRef.current.detectForVideo(video, startTimeMs);

      if (results && results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];

        // Mirror landmarks coordinates since video is drawn mirrored
        const processedLandmarks: JointPoint[] = landmarks.map(lm => ({
          x: 1 - lm.x, // Flip X coordinate
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility ?? 1
        }));

        // Draw skeleton overlay
        drawSkeleton(ctx, processedLandmarks, canvas.width, canvas.height);

        // Extract Joint coordinates
        // 11: Left Shoulder, 13: Left Elbow, 15: Left Wrist
        // 12: Right Shoulder, 14: Right Elbow, 16: Right Wrist
        // 24: Right Hip, 26: Right Knee, 28: Right Ankle
        const leftShoulder = processedLandmarks[11];
        const leftElbow = processedLandmarks[13];
        const leftWrist = processedLandmarks[15];

        const rightShoulder = processedLandmarks[12];
        const rightElbow = processedLandmarks[14];
        const rightWrist = processedLandmarks[16];

        const rightHip = processedLandmarks[24];
        const rightKnee = processedLandmarks[26];
        const rightAnkle = processedLandmarks[28];

        // Compute real-time angles
        const lElbowAng = calculateAngle(leftShoulder, leftElbow, leftWrist);
        const rElbowAng = calculateAngle(rightShoulder, rightElbow, rightWrist);
        const rKneeAng = calculateAngle(rightHip, rightKnee, rightAnkle);

        setAngles({
          leftElbow: leftShoulder?.visibility! > 0.5 ? lElbowAng : 0,
          rightElbow: rightShoulder?.visibility! > 0.5 ? rElbowAng : 0,
          rightKnee: rightHip?.visibility! > 0.5 ? rKneeAng : 0
        });

        // Compute posture score
        const activeElb = rElbowAng > 0 ? rElbowAng : lElbowAng;
        const currentScore = getFormScore(lElbowAng, rElbowAng, rKneeAng, exercise);
        setFormScore(currentScore);

        if (isSessionActive) {
          setSessionScores(prev => [...prev, currentScore]);
        }

        // Coaching analysis and text triggers
        if (exercise === 'bicep_curl') {
          const feedback = processElbowCoaching(activeElb);
          setCoachingFeedback(feedback);

          // Track repetitions based on arm flexion/extension
          if (activeElb > 150 && lastRepStateRef.current !== 'extended') {
            lastRepStateRef.current = 'extended';
          } else if (activeElb < 100 && lastRepStateRef.current === 'extended') {
            lastRepStateRef.current = 'flexed';
            if (isSessionActive) {
              setRepCount(r => r + 1);
              speakHindiFeedback('एक रिपिटेशन!', true);
            }
          }
        } else if (exercise === 'squats') {
          // Knees coaching
          if (rKneeAng > 160) {
            setCoachingFeedback({ text: 'नीचे झुकें (Squat Down)', category: 'straight' });
            speakHindiFeedback('नीचे झुकें');
            lastRepStateRef.current = 'extended';
          } else if (rKneeAng >= 90 && rKneeAng <= 115) {
            setCoachingFeedback({ text: 'बहुत अच्छा! बने रहें (Good Form!)', category: 'good' });
            speakHindiFeedback('बहुत अच्छा!');
            if (lastRepStateRef.current === 'extended') {
              lastRepStateRef.current = 'flexed';
              if (isSessionActive) {
                setRepCount(r => r + 1);
                speakHindiFeedback('एक स्क्वाट पूरा!', true);
              }
            }
          } else if (rKneeAng < 90) {
            setCoachingFeedback({ text: 'ज्यादा नीचे झुक गए (Too Deep)', category: 'bend' });
            speakHindiFeedback('ज्यादा नीचे झुक गए, थोड़ा ऊपर आयें');
          }
        }
      } else {
        // No body detected
        setCoachingFeedback({ text: 'कैमरे के सामने आयें (Align Body)', category: 'idle' });
      }
    }

    requestRef.current = requestAnimationFrame(runWebcamTrackingLoop);
  };

  // --- SIMULATED TRAINING LOOP ---
  const runSimulatedLoop = () => {
    if (cameraMode !== 'simulated' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 640;
    canvas.height = 480;

    // Clear and draw grid background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Oscillate angle to simulate sports motion
    const speed = exercise === 'bicep_curl' ? 0.9 : 0.6;
    const timeFactor = Date.now() / 1000;
    let mockLeftElbow = 0;
    let mockRightElbow = 0;
    let mockRightKnee = 0;

    // Create realistic 33 joints mockup base
    const landmarks: JointPoint[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, visibility: 0 }));

    if (exercise === 'bicep_curl') {
      // Bicep Curl sweeps elbow between 65° and 170°
      const angle = 117.5 + 52.5 * Math.sin(timeFactor * speed);
      mockRightElbow = Math.round(angle);
      mockLeftElbow = Math.round(117.5 + 52.5 * Math.cos(timeFactor * speed));

      // Build simulated bicep curl landmarks
      // Nose
      landmarks[0] = { x: 0.5, y: 0.15, visibility: 1 };
      // Shoulders
      landmarks[11] = { x: 0.42, y: 0.28, visibility: 1 }; // Left Shoulder
      landmarks[12] = { x: 0.58, y: 0.28, visibility: 1 }; // Right Shoulder
      // Elbows
      landmarks[13] = { x: 0.40, y: 0.42, visibility: 1 }; // Left Elbow
      landmarks[14] = { x: 0.60, y: 0.42, visibility: 1 }; // Right Elbow
      
      // Calculate wrist position based on simulated angle
      // Vector Shoulder -> Elbow points straight down. Elbow is at (0.6, 0.42). 
      // Wrist rotates around Elbow
      const angleRad = (mockRightElbow * Math.PI) / 180;
      landmarks[15] = { 
        x: 0.40 - 0.12 * Math.sin((mockLeftElbow * Math.PI) / 180), 
        y: 0.42 - 0.12 * Math.cos((mockLeftElbow * Math.PI) / 180), 
        visibility: 1 
      };
      landmarks[16] = { 
        x: 0.60 + 0.12 * Math.sin(angleRad), 
        y: 0.42 - 0.12 * Math.cos(angleRad), 
        visibility: 1 
      };

      // Hip joints for visual balance
      landmarks[23] = { x: 0.44, y: 0.60, visibility: 1 };
      landmarks[24] = { x: 0.56, y: 0.60, visibility: 1 };
      landmarks[25] = { x: 0.44, y: 0.78, visibility: 1 };
      landmarks[26] = { x: 0.56, y: 0.78, visibility: 1 };
      landmarks[27] = { x: 0.44, y: 0.94, visibility: 1 };
      landmarks[28] = { x: 0.56, y: 0.94, visibility: 1 };

    } else if (exercise === 'squats') {
      // Squat sweeps right knee angle between 85° and 175°
      const angle = 130 + 45 * Math.sin(timeFactor * speed);
      mockRightKnee = Math.round(angle);
      
      // Build simulated squat landmarks
      landmarks[0] = { x: 0.5, y: 0.2 - 0.08 * Math.cos(timeFactor * speed), visibility: 1 }; // Head bobbing
      landmarks[11] = { x: 0.44, y: 0.3 - 0.08 * Math.cos(timeFactor * speed), visibility: 1 };
      landmarks[12] = { x: 0.56, y: 0.3 - 0.08 * Math.cos(timeFactor * speed), visibility: 1 };
      landmarks[13] = { x: 0.41, y: 0.35 - 0.08 * Math.cos(timeFactor * speed), visibility: 1 };
      landmarks[14] = { x: 0.59, y: 0.35 - 0.08 * Math.cos(timeFactor * speed), visibility: 1 };
      landmarks[15] = { x: 0.40, y: 0.25 - 0.08 * Math.cos(timeFactor * speed), visibility: 1 };
      landmarks[16] = { x: 0.60, y: 0.25 - 0.08 * Math.cos(timeFactor * speed), visibility: 1 };

      // Hips move down during squat
      const hipY = 0.52 + 0.12 * Math.sin(timeFactor * speed);
      landmarks[23] = { x: 0.45, y: hipY, visibility: 1 };
      landmarks[24] = { x: 0.55, y: hipY, visibility: 1 };

      // Knees push forward/outward slightly
      const kneeXOffset = 0.04 * Math.sin(timeFactor * speed);
      landmarks[25] = { x: 0.42 - kneeXOffset, y: 0.72, visibility: 1 };
      landmarks[26] = { x: 0.58 + kneeXOffset, y: 0.72, visibility: 1 };

      // Feet stay anchored
      landmarks[27] = { x: 0.44, y: 0.90, visibility: 1 };
      landmarks[28] = { x: 0.56, y: 0.90, visibility: 1 };
    }

    setAngles({
      leftElbow: mockLeftElbow,
      rightElbow: mockRightElbow,
      rightKnee: mockRightKnee
    });

    // Compute live scores and feedback
    const activeElb = mockRightElbow;
    const activeKnee = mockRightKnee;

    const currentScore = getFormScore(mockLeftElbow, mockRightElbow, mockRightKnee, exercise);
    setFormScore(currentScore);

    if (isSessionActive) {
      setSessionScores(prev => [...prev, currentScore]);
    }

    // Run active triggers and state changes
    if (exercise === 'bicep_curl') {
      const feedback = processElbowCoaching(activeElb);
      setCoachingFeedback(feedback);

      // Simple rep-counter simulator
      if (activeElb > 155 && lastRepStateRef.current !== 'extended') {
        lastRepStateRef.current = 'extended';
      } else if (activeElb < 100 && lastRepStateRef.current === 'extended') {
        lastRepStateRef.current = 'flexed';
        if (isSessionActive) {
          setRepCount(r => r + 1);
          speakHindiFeedback('एक रिपिटेशन!', true);
        }
      }
    } else if (exercise === 'squats') {
      if (activeKnee > 155) {
        setCoachingFeedback({ text: 'नीचे झुकें (Squat Down)', category: 'straight' });
        speakHindiFeedback('नीचे झुकें');
        lastRepStateRef.current = 'extended';
      } else if (activeKnee >= 95 && activeKnee <= 115) {
        setCoachingFeedback({ text: 'बहुत अच्छा! बने रहें (Good Form!)', category: 'good' });
        speakHindiFeedback('बहुत अच्छा!');
        if (lastRepStateRef.current === 'extended') {
          lastRepStateRef.current = 'flexed';
          if (isSessionActive) {
            setRepCount(r => r + 1);
            speakHindiFeedback('एक स्क्वाट पूरा!', true);
          }
        }
      } else if (activeKnee < 95) {
        setCoachingFeedback({ text: 'ज्यादा नीचे झुक गए (Too Deep)', category: 'bend' });
        speakHindiFeedback('ज्यादा नीचे झुक गए');
      }
    }

    drawSkeleton(ctx, landmarks, canvas.width, canvas.height);

    requestRef.current = requestAnimationFrame(runSimulatedLoop);
  };

  // --- GENERAL SKELETON DRAWER ---
  const drawSkeleton = (ctx: CanvasRenderingContext2D, landmarks: JointPoint[], width: number, height: number) => {
    // Joints connections index mapping pairs
    const connections = [
      [11, 12], // Shoulder to shoulder
      [11, 13], [13, 15], // Left arm (Shoulder -> Elbow -> Wrist)
      [12, 14], [14, 16], // Right arm
      [11, 23], [12, 24], // Torso sides
      [23, 24], // Hip to hip
      [23, 25], [25, 27], // Left Leg (Hip -> Knee -> Ankle)
      [24, 26], [26, 28]  // Right Leg
    ];

    // 1. Draw connections
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    connections.forEach(([p1, p2]) => {
      const joint1 = landmarks[p1];
      const joint2 = landmarks[p2];
      if (joint1 && joint2 && joint1.visibility! > 0.4 && joint2.visibility! > 0.4) {
        ctx.beginPath();
        ctx.moveTo(joint1.x * width, joint1.y * height);
        ctx.lineTo(joint2.x * width, joint2.y * height);
        
        // Active glowing line styles
        ctx.strokeStyle = '#2563eb'; // Electric blue
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#3b82f6';
        ctx.stroke();
      }
    });

    // Reset shadow
    ctx.shadowBlur = 0;

    // 2. Draw circular joints
    landmarks.forEach((landmark, idx) => {
      // Only draw major structural sports joint landmarks to reduce clutter
      const majorJoints = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];
      if (landmark.visibility! > 0.4 && majorJoints.includes(idx)) {
        ctx.beginPath();
        ctx.arc(landmark.x * width, landmark.y * height, 7, 0, 2 * Math.PI);
        ctx.fillStyle = '#00e676'; // Neon Athletic Green
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
      }
    });
  };

  // --- WORKOUT CONTROL FUNCTIONS ---
  const startSession = () => {
    setIsSessionActive(true);
    setSessionStartTime(Date.now());
    setRepCount(0);
    setSessionScores([]);
    setSavedSuccess(false);
    speakHindiFeedback('सत्र शुरू! अपना अभ्यास शुरू करें।', true);
  };

  const endSession = () => {
    setIsSessionActive(false);
    speakHindiFeedback('सत्र समाप्त। आपकी परफॉरमेंस की गणना हो गयी है।', true);
  };

  const saveWorkoutScore = () => {
    if (sessionScores.length === 0 || !sessionStartTime) return;

    // Average score
    const total = sessionScores.reduce((acc, curr) => acc + curr, 0);
    const averageScore = Math.round(total / sessionScores.length);
    const duration = Math.round((Date.now() - sessionStartTime) / 1000);

    const newLog: SavedScore = {
      id: Math.random().toString(36).substring(2, 9),
      exercise,
      score: averageScore,
      timestamp: Date.now(),
      maxLeftElbow: angles.leftElbow,
      maxRightElbow: angles.rightElbow,
      maxRightKnee: angles.rightKnee,
      durationSeconds: duration
    };

    try {
      const existing = localStorage.getItem('khelmitra_scores');
      const scoreList = existing ? JSON.parse(existing) : [];
      scoreList.push(newLog);
      localStorage.setItem('khelmitra_scores', JSON.stringify(scoreList));
      
      setSavedSuccess(true);
      speakHindiFeedback('स्कोर सुरक्षित कर लिया गया है!', true);
      setTimeout(() => {
        setSavedSuccess(false);
        setSessionStartTime(null);
        setRepCount(0);
        setSessionScores([]);
      }, 2500);
    } catch (e) {
      console.error("Failed to save score:", e);
    }
  };

  const getCoachingColor = (category: string) => {
    switch (category) {
      case 'good': return 'border-emerald-500 bg-emerald-950/40 text-emerald-300 shadow-emerald-500/10';
      case 'straight': return 'border-amber-500 bg-amber-950/40 text-amber-300 shadow-amber-500/10';
      case 'bend': return 'border-red-500 bg-red-950/40 text-red-300 shadow-red-500/10';
      default: return 'border-zinc-700 bg-zinc-800/50 text-zinc-300';
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full bg-zinc-950">
      
      {/* Exercise Selector & Mode Selection Header */}
      <div className="p-3 bg-zinc-950 border-b border-zinc-800 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Dumbbell className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-black text-zinc-100 tracking-tight uppercase">KhelMitra AI Coach</span>
          </div>
          {/* Hardware Camera selection switch */}
          <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800 shrink-0">
            <button
              onClick={() => setCameraMode('simulated')}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition ${
                cameraMode === 'simulated'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Simulate AI
            </button>
            <button
              onClick={() => setCameraMode('webcam')}
              className={`px-2.5 py-1 rounded text-[10px] font-semibold transition flex items-center gap-1 ${
                cameraMode === 'webcam'
                  ? 'bg-emerald-600 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Camera className="w-3 h-3" /> Live Camera
            </button>
          </div>
        </div>

        {/* Tab exercise selector */}
        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            onClick={() => setExercise('bicep_curl')}
            className={`py-2 rounded-lg text-xs font-bold border transition-all ${
              exercise === 'bicep_curl'
                ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/50'
                : 'bg-zinc-900/60 text-zinc-400 border-transparent hover:bg-zinc-900'
            }`}
          >
            Bicep Curls (elbows)
          </button>
          <button
            onClick={() => setExercise('squats')}
            className={`py-2 rounded-lg text-xs font-bold border transition-all ${
              exercise === 'squats'
                ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/50'
                : 'bg-zinc-900/60 text-zinc-400 border-transparent hover:bg-zinc-900'
            }`}
          >
            Squats (knee angle)
          </button>
        </div>
      </div>

      {/* Main Camera / Visual Overlay Display */}
      <div className="flex-1 min-h-[220px] bg-zinc-950 relative overflow-hidden flex items-center justify-center">
        {/* HTML5 video element hidden behind overlay */}
        <video
          ref={videoRef}
          className="hidden"
          playsInline
          muted
          width="640"
          height="480"
        />

        {/* Canvas overlays */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover max-h-[380px]"
        />

        {/* Model/Camera status overlay */}
        {isLoadingModel && (
          <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center p-6 text-center z-30">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-4" />
            <p className="text-sm font-semibold text-zinc-200">Downloading Pose Models...</p>
            <p className="text-[10px] text-zinc-500 mt-1 max-w-[220px]">
              Retrieving Google MediaPipe tasks-vision components for real-time 33-point tracking.
            </p>
          </div>
        )}

        {cameraPermissionError && (
          <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center p-6 text-center z-30 select-text">
            <ShieldAlert className="w-10 h-10 text-rose-500 mb-3" />
            <p className="text-xs font-bold text-zinc-200">Camera Access Denied</p>
            <p className="text-[10px] text-zinc-500 mt-2 max-w-[240px] leading-relaxed">
              Browser policies restricted camera permissions inside the iframe preview. Open in a new tab or use the "Simulate AI" mode.
            </p>
          </div>
        )}

        {modelError && (
          <div className="absolute inset-0 bg-zinc-950/95 flex flex-col items-center justify-center p-6 text-center z-30 select-text">
            <AlertCircle className="w-10 h-10 text-amber-500 mb-3" />
            <p className="text-xs font-bold text-zinc-200">Webcam Initialization Failed</p>
            <p className="text-[10px] text-zinc-400 mt-2 max-w-[240px] leading-relaxed">
              Error details: {modelError}
            </p>
          </div>
        )}

        {/* Repetition count floating badge during session */}
        {isSessionActive && (
          <div className="absolute top-3 left-3 bg-zinc-950/80 backdrop-blur-md border border-emerald-500/30 px-3 py-1.5 rounded-full text-zinc-200 font-sans font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-black/40 z-20">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Reps: <strong className="text-emerald-400 font-mono text-sm">{repCount}</strong></span>
          </div>
        )}

        {/* Real-time Angles Overlay */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1 z-20 pointer-events-none">
          {exercise === 'bicep_curl' ? (
            <>
              {angles.rightElbow > 0 && (
                <div className="bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 px-2.5 py-1 rounded-md text-[10px] text-zinc-300 font-mono">
                  Right Elbow: <span className="text-emerald-400 font-bold">{angles.rightElbow}°</span>
                </div>
              )}
              {angles.leftElbow > 0 && (
                <div className="bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 px-2.5 py-1 rounded-md text-[10px] text-zinc-300 font-mono">
                  Left Elbow: <span className="text-emerald-400 font-bold">{angles.leftElbow}°</span>
                </div>
              )}
            </>
          ) : (
            angles.rightKnee > 0 && (
              <div className="bg-zinc-950/80 backdrop-blur-sm border border-zinc-800 px-2.5 py-1 rounded-md text-[10px] text-zinc-300 font-mono">
                Knee Angle: <span className="text-emerald-400 font-bold">{angles.rightKnee}°</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Real-time coaching prompts displaying Speech Audio WAVEFORM */}
      {coachingFeedback.text && (
        <div className={`mx-3 mt-3 p-3 rounded-xl border shadow-lg flex items-center justify-between transition-all duration-300 ${getCoachingColor(coachingFeedback.category)} shrink-0`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800/60 flex items-center justify-center shrink-0">
              <Volume2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase font-sans">Voice AI Feedback (Hindi)</div>
              <h2 className="text-sm font-black tracking-tight mt-0.5">{coachingFeedback.text}</h2>
            </div>
          </div>
          {/* Minimalist animated voice wavelines */}
          <div className="flex items-end gap-0.5 h-6">
            <span className={`w-0.5 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_100ms] ${coachingFeedback.category !== 'idle' ? 'h-4' : 'h-1.5'}`} />
            <span className={`w-0.5 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_200ms] ${coachingFeedback.category !== 'idle' ? 'h-6' : 'h-1.5'}`} />
            <span className={`w-0.5 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_300ms] ${coachingFeedback.category !== 'idle' ? 'h-3' : 'h-1.5'}`} />
          </div>
        </div>
      )}

      {/* Session controls / Stats bottom dashboard */}
      <div className="p-4 bg-zinc-950 border-t border-zinc-800/60 flex flex-col gap-3 shrink-0">
        
        {/* Dynamic active session dashboard or pre-session banner */}
        {isSessionActive ? (
          <div className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-3">
              {/* Circular Form score ring */}
              <div className="relative w-12 h-12 flex items-center justify-center rounded-full border-4 border-zinc-800">
                <span className="text-sm font-black text-emerald-400 font-mono">{formScore}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase leading-none block">Real-time Form</span>
                <span className="text-xs font-bold text-zinc-300">Maintaining Posture...</span>
              </div>
            </div>

            <button
              onClick={endSession}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-zinc-950 font-bold text-xs rounded-lg shadow-md hover:scale-[1.02] active:scale-95 transition flex items-center gap-1.5"
            >
              <Square className="w-3.5 h-3.5 fill-current" /> Stop Set
            </button>
          </div>
        ) : sessionScores.length > 0 ? (
          /* Session finished summary panel */
          <div className="p-3 bg-zinc-900 border border-emerald-500/30 rounded-xl flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase leading-none">Session Summary</span>
                <h3 className="text-xs font-bold text-zinc-300 mt-1">Average Form: <span className="text-emerald-400 font-black">{Math.round(sessionScores.reduce((a,b)=>a+b, 0) / sessionScores.length)}/100</span></h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-zinc-500 uppercase leading-none">Reps Completed</span>
                <h3 className="text-xs font-black text-emerald-400 mt-1">{repCount}</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={startSession}
                className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs rounded-lg transition"
              >
                Retry
              </button>
              
              <button
                onClick={saveWorkoutScore}
                disabled={savedSuccess}
                className="py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs rounded-lg shadow-md hover:scale-[1.02] active:scale-95 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" /> Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Save Score
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Normal state waiting to start session */
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h3 className="text-xs font-bold text-zinc-400">Get Ready</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5 leading-tight">Start an active set to save scores</p>
            </div>
            
            <button
              onClick={startSession}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs rounded-lg shadow-lg shadow-emerald-500/10 hover:scale-[1.02] active:scale-95 transition flex items-center gap-1.5 shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Start Set
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
