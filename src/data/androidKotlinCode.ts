/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CodeFile } from '../types';

export const kotlinProjectFiles: CodeFile[] = [
  {
    name: 'build.gradle.kts',
    path: 'app/build.gradle.kts',
    language: 'kotlin',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.khelmitra.coaching"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.khelmitra.coaching"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    composeOptions {
        kotlinCompilerExtensionVersion = "1.5.1"
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)

    // CameraX dependencies
    val cameraxVersion = "1.3.1"
    implementation("androidx.camera:camera-core:$cameraxVersion")
    implementation("androidx.camera:camera-camera2:$cameraxVersion")
    implementation("androidx.camera:camera-lifecycle:$cameraxVersion")
    implementation("androidx.camera:camera-view:$cameraxVersion")

    // Google MediaPipe Tasks-Vision dependency for Pose Landmark Detection
    implementation("com.google.mediapipe:tasks-vision:0.10.8")

    // Guava for concurrent futures used in CameraX
    implementation("com.google.guava:guava:32.1.2-android")
}`
  },
  {
    name: 'AndroidManifest.xml',
    path: 'app/src/main/AndroidManifest.xml',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Request Camera Permission -->
    <uses-permission android:name="android.permission.CAMERA" />
    
    <!-- Declare camera hardware feature is required -->
    <uses-feature android:name="android.hardware.camera" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.KhelMitra"
        tools:targetApi="31">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:theme="@style/Theme.KhelMitra">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>`
  },
  {
    name: 'MainActivity.kt',
    path: 'app/src/main/java/com/khelmitra/coaching/MainActivity.kt',
    language: 'kotlin',
    content: `package com.khelmitra.coaching

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.tts.TextToSpeech
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.core.content.ContextCompat
import com.khelmitra.coaching.ui.KhelMitraApp
import com.khelmitra.coaching.ui.theme.KhelMitraTheme
import java.util.Locale

class MainActivity : ComponentActivity(), TextToSpeech.OnInitListener {

    private lateinit var tts: TextToSpeech
    private var isTtsInitialized = false

    private val requestPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (!isGranted) {
            Toast.makeText(this, "Camera permission is required for posture coaching!", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Initialize Hindi TTS
        tts = TextToSpeech(this, this)

        // Request camera permission on first launch
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            requestPermissionLauncher.launch(Manifest.permission.CAMERA)
        }

        setContent {
            KhelMitraTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    KhelMitraApp(
                        tts = tts,
                        isTtsReady = isTtsInitialized,
                        sharedPrefs = getSharedPreferences("KhelMitraScores", Context.MODE_PRIVATE)
                    )
                }
            }
        }
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            val result = tts.setLanguage(Locale("hi", "IN"))
            if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
                Toast.makeText(this, "Hindi Speech data not available. Installing...", Toast.LENGTH_SHORT).show()
            } else {
                isTtsInitialized = true
            }
        }
    }

    override fun onDestroy() {
        if (::tts.isInitialized) {
            tts.stop()
            tts.shutdown()
        }
        super.onDestroy()
    }
}`
  },
  {
    name: 'PoseLandmarkerHelper.kt',
    path: 'app/src/main/java/com/khelmitra/coaching/PoseLandmarkerHelper.kt',
    language: 'kotlin',
    content: `package com.khelmitra.coaching

import android.content.Context
import android.graphics.Bitmap
import android.os.SystemClock
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.framework.image.MPImage
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.core.Delegate
import com.google.mediapipe.tasks.vision.core.RunningMode
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarker
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult

class PoseLandmarkerHelper(
    val context: Context,
    val runningMode: RunningMode = RunningMode.LIVE_STREAM,
    val poseLandmarkerHelperListener: LandmarkerListener? = null
) {
    private var poseLandmarker: PoseLandmarker? = null

    init {
        setupPoseLandmarker()
    }

    fun setupPoseLandmarker() {
        val baseOptionsBuilder = BaseOptions.builder()
            .setDelegate(Delegate.GPU)
            // Expecting pose_landmarker_full.task under assets/
            .setModelAssetPath("pose_landmarker_full.task")

        try {
            val optionsBuilder = PoseLandmarker.PoseLandmarkerOptions.builder()
                .setBaseOptions(baseOptionsBuilder.build())
                .setRunningMode(runningMode)
                .setNumPoses(1)

            if (runningMode == RunningMode.LIVE_STREAM) {
                optionsBuilder
                    .setResultListener(this::returnLivestreamResult)
                    .setErrorListener(this::returnLivestreamError)
            }

            poseLandmarker = PoseLandmarker.createFromOptions(context, optionsBuilder.build())
        } catch (e: IllegalStateException) {
            poseLandmarkerHelperListener?.onError("Pose Landmarker failed to initialize: " + e.message)
        }
    }

    fun detectLiveStream(bitmap: Bitmap, isFrontCamera: Boolean) {
        if (runningMode != RunningMode.LIVE_STREAM) return

        val frameTime = SystemClock.uptimeMillis()
        val mpImage = BitmapImageBuilder(bitmap).build()
        
        // Front camera streams need to be mirrored internally sometimes
        poseLandmarker?.detectAsync(mpImage, frameTime)
    }

    private fun returnLivestreamResult(result: PoseLandmarkerResult, input: MPImage) {
        poseLandmarkerHelperListener?.onResults(result, input)
    }

    private fun returnLivestreamError(error: RuntimeException) {
        poseLandmarkerHelperListener?.onError(error.message ?: "An unknown stream error occurred")
    }

    fun close() {
        poseLandmarker?.close()
        poseLandmarker = null
    }

    interface LandmarkerListener {
        fun onError(error: String)
        fun onResults(result: PoseLandmarkerResult, input: MPImage)
    }
}`
  },
  {
    name: 'FormScorer.kt',
    path: 'app/src/main/java/com/khelmitra/coaching/FormScorer.kt',
    language: 'kotlin',
    content: `package com.khelmitra.coaching

import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult
import kotlin.math.abs
import kotlin.math.acos
import kotlin.math.sqrt

data class JointAngles(
    val leftElbow: Float,
    val rightElbow: Float,
    val rightKnee: Float
)

object FormScorer {

    /**
     * Calculates angle at Point B (vertex) formed by points A, B, and C
     */
    fun calculateAngle(
        aX: Float, aY: Float,
        bX: Float, bY: Float,
        cX: Float, cY: Float
    ): Float {
        // Vectors
        val baX = aX - bX
        val baY = aY - bY
        val bcX = cX - bX
        val bcY = cY - bY

        // Dot product
        val dotProduct = baX * bcX + baY * bcY

        // Magnitudes
        val magBA = sqrt(baX * baX + baY * baY)
        val magBC = sqrt(bcX * bcX + bcY * bcY)

        if (magBA == 0f || magBC == 0f) return 0f

        var cosTheta = dotProduct / (magBA * magBC)
        cosTheta = cosTheta.coerceIn(-1.0f, 1.0f)

        val angleRad = acos(cosTheta)
        return Math.toDegrees(angleRad.toDouble()).toFloat()
    }

    fun extractAngles(result: PoseLandmarkerResult): JointAngles {
        val landmarks = result.landmarks().firstOrNull() ?: return JointAngles(0f, 0f, 0f)
        
        // Landmark coordinates (MediaPipe landmarks are normalized between 0 and 1)
        // 11: Left Shoulder, 13: Left Elbow, 15: Left Wrist
        // 12: Right Shoulder, 14: Right Elbow, 16: Right Wrist
        // 24: Right Hip, 26: Right Knee, 28: Right Ankle
        
        var leftElbowAngle = 0f
        var rightElbowAngle = 0f
        var rightKneeAngle = 0f

        if (landmarks.size > 15) {
            val leftShoulder = landmarks[11]
            val leftElbow = landmarks[13]
            val leftWrist = landmarks[15]
            leftElbowAngle = calculateAngle(
                leftShoulder.x(), leftShoulder.y(),
                leftElbow.x(), leftElbow.y(),
                leftWrist.x(), leftWrist.y()
            )
        }

        if (landmarks.size > 16) {
            val rightShoulder = landmarks[12]
            val rightElbow = landmarks[14]
            val rightWrist = landmarks[16]
            rightElbowAngle = calculateAngle(
                rightShoulder.x(), rightShoulder.y(),
                rightElbow.x(), rightElbow.y(),
                rightWrist.x(), rightWrist.y()
            )
        }

        if (landmarks.size > 28) {
            val rightHip = landmarks[24]
            val rightKnee = landmarks[26]
            val rightAnkle = landmarks[28]
            rightKneeAngle = calculateAngle(
                rightHip.x(), rightHip.y(),
                rightKnee.x(), rightKnee.y(),
                rightAnkle.x(), rightAnkle.y()
            )
        }

        return JointAngles(leftElbowAngle, rightElbowAngle, rightKneeAngle)
    }

    /**
     * Compute session score based on angles
     */
    fun calculateScore(angles: JointAngles, exercise: String): Int {
        if (angles.leftElbow == 0f && angles.rightElbow == 0f && angles.rightKnee == 0f) return 0

        return when (exercise) {
            "bicep_curl" -> {
                val activeElbow = if (angles.rightElbow > 0) angles.rightElbow else angles.leftElbow
                if (activeElbow >= 120f && activeElbow <= 160f) {
                    100
                } else if (activeElbow > 160f) {
                    val penalty = ((activeElbow - 160f) / 20f) * 40f
                    (100 - penalty).toInt().coerceAtLeast(40)
                } else {
                    val penalty = ((120f - activeElbow) / 60f) * 70f
                    (100 - penalty).toInt().coerceAtLeast(30)
                }
            }
            "squats" -> {
                val knee = angles.rightKnee
                if (knee >= 90f && knee <= 115f) {
                    100
                } else if (knee > 115f) {
                    val penalty = ((knee - 115f) / 65f) * 70f
                    (100 - penalty).toInt().coerceAtLeast(30)
                } else {
                    val penalty = ((90f - knee) / 50f) * 80f
                    (100 - penalty).toInt().coerceAtLeast(20)
                }
            }
            else -> {
                val elbowScore = if (angles.rightElbow in 120f..160f) 100 else 70
                val kneeScore = if (angles.rightKnee in 130f..170f) 100 else 60
                (elbowScore + kneeScore) / 2
            }
        }
    }
}`
  },
  {
    name: 'CameraPreview.kt',
    path: 'app/src/main/java/com/khelmitra/coaching/ui/CameraPreview.kt',
    language: 'kotlin',
    content: `package com.khelmitra.coaching.ui

import android.util.Log
import android.view.ViewGroup
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.google.mediapipe.tasks.vision.poselandmarker.PoseLandmarkerResult
import com.khelmitra.coaching.PoseLandmarkerHelper
import java.util.concurrent.Executors

@Composable
fun CameraPreview(
    modifier: Modifier = Modifier,
    exerciseType: String,
    onAnglesUpdated: (Float, Float, Float) -> Unit,
    activePoseResult: PoseLandmarkerResult?
) {
    const val TAG = "CameraPreview"
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val cameraExecutor = remember { Executors.newSingleThreadExecutor() }

    Box(modifier = modifier.fillMaxSize()) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                val previewView = PreviewView(ctx).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    scaleType = PreviewView.ScaleType.FILL_CENTER
                }

                val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
                cameraProviderFuture.addListener({
                    val cameraProvider = cameraProviderFuture.get()

                    val preview = Preview.Builder().build().apply {
                        setSurfaceProvider(previewView.surfaceProvider)
                    }

                    // Configure ImageAnalysis for MediaPipe real-time inference
                    val imageAnalysis = ImageAnalysis.Builder()
                        .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                        .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_RGBA_8888)
                        .build()

                    val poseHelper = PoseLandmarkerHelper(
                        context = ctx,
                        poseLandmarkerHelperListener = object : PoseLandmarkerHelper.LandmarkerListener {
                            override fun onError(error: String) {
                                Log.e(TAG, "MediaPipe Error: $error")
                            }

                            override fun onResults(result: PoseLandmarkerResult, input: com.google.mediapipe.framework.image.MPImage) {
                                // Extract joint angles in real-time
                                val angles = FormScorer.extractAngles(result)
                                onAnglesUpdated(angles.leftElbow, angles.rightElbow, angles.rightKnee)
                            }
                        }
                    )

                    imageAnalysis.setAnalyzer(cameraExecutor) { imageProxy ->
                        val bitmap = imageProxy.toBitmap()
                        poseHelper.detectLiveStream(bitmap, isFrontCamera = true)
                        imageProxy.close()
                    }

                    val cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA

                    try {
                        cameraProvider.unbindAll()
                        cameraProvider.bindToLifecycle(
                            lifecycleOwner,
                            cameraSelector,
                            preview,
                            imageAnalysis
                        )
                    } catch (exc: Exception) {
                        Log.e(TAG, "Camera binding failed", exc)
                    }

                }, ContextCompat.getMainExecutor(ctx))

                previewView
            }
        )

        // Jetpack Compose Canvas overlay drawing the 33 skeletal body joints
        activePoseResult?.let { poseResult ->
            SkeletonOverlay(poseResult = poseResult)
        }
    }
}

@Composable
fun SkeletonOverlay(poseResult: PoseLandmarkerResult) {
    Canvas(modifier = Modifier.fillMaxSize()) {
        val landmarks = poseResult.landmarks().firstOrNull() ?: return@Canvas
        val width = size.width
        val height = size.height

        // Draw connections
        fun drawLineBetween(fromIdx: Int, toIdx: Int, color: Color) {
            if (landmarks.size > fromIdx && landmarks.size > toIdx) {
                val start = landmarks[fromIdx]
                val end = landmarks[toIdx]
                if (start.presence().orElse(0f) > 0.5 && end.presence().orElse(0f) > 0.5) {
                    drawLine(
                        color = color,
                        start = Offset(start.x() * width, start.y() * height),
                        end = Offset(end.x() * width, end.y() * height),
                        strokeWidth = 6f
                    )
                }
            }
        }

        // Draw joints
        landmarks.forEach { lm ->
            if (lm.presence().orElse(0f) > 0.5) {
                drawCircle(
                    color = Color(0xFF00E676), // Athletic Green
                    radius = 10f,
                    center = Offset(lm.x() * width, lm.y() * height)
                )
            }
        }

        // Connect skeletal joints (e.g., shoulders, elbows, wrists, hips, knees, ankles)
        val skeletonColor = Color(0xFF29B6F6) // Electric Blue
        drawLineBetween(11, 12, skeletonColor) // Shoulders
        drawLineBetween(11, 13, skeletonColor) // Left Upper Arm
        drawLineBetween(13, 15, skeletonColor) // Left Forearm
        drawLineBetween(12, 14, skeletonColor) // Right Upper Arm
        drawLineBetween(14, 16, skeletonColor) // Right Forearm
        drawLineBetween(11, 23, skeletonColor) // Left Torso
        drawLineBetween(12, 24, skeletonColor) // Right Torso
        drawLineBetween(23, 24, skeletonColor) // Hips
        drawLineBetween(23, 25, skeletonColor) // Left Thigh
        drawLineBetween(25, 27, skeletonColor) // Left Shin
        drawLineBetween(24, 26, skeletonColor) // Right Thigh
        drawLineBetween(26, 28, skeletonColor) // Right Shin
    }
}`
  }
];
