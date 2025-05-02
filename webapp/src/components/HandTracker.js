import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import PropTypes from 'prop-types';

// --- Core Configuration Constants ---

/** Minimum distance between thumb and middle finger tips (normalized coordinates) to trigger a click. Adjust for sensitivity. */
const CLICK_DISTANCE_THRESHOLD = 0.045; // Slightly reduced for less sensitivity (prevents accidental clicks)
/** Minimum time (ms) between consecutive clicks to prevent unintended rapid firing. */
const CLICK_COOLDOWN_MS = 500;
/** Maximum number of hands to detect and track simultaneously. */
const MAX_HANDS = 4;
/** Array of colors used cyclically for different detected hands' cursors. */
const HAND_COLORS = ['red', 'lime', 'cyan', 'yellow', 'magenta', 'orange'];
/** Visual feedback color for the cursor during the click animation. */
const CLICK_EFFECT_COLOR = 'blue';
/** Visual feedback scale factor for the cursor during the click animation. */
const CLICK_EFFECT_SCALE = 1.5;
/** Duration (ms) of the visual click feedback animation. */
const CLICK_EFFECT_DURATION_MS = 150;
/** Maximum time (ms) to wait for the first results from MediaPipe after camera start before timing out. */
const INIT_TIMEOUT_MS = 20000;
/** Minimum guaranteed duration (ms) for the CLEANING_UP state to allow internal processes to settle. */
const MIN_CLEANUP_DURATION_MS = 750;
/** Short delay (ms) after logical cleanup before hiding the visual "Desactivando..." message. */
const VISUAL_CLEANUP_DELAY_MS = 100;

// --- MediaPipe Hands Configuration ---
const MEDIAPIPE_HANDS_OPTIONS = {
  /** Maximum number of hands to detect. */
  maxNumHands: MAX_HANDS,
  /** Complexity of the hand landmark model (0 = lite, 1 = full). Full offers better accuracy. */
  modelComplexity: 1,
  /** Minimum confidence score ([0.0, 1.0]) for hand detection to be considered successful. Higher values reduce false positives but may miss hands in difficult conditions. */
  minDetectionConfidence: 0.75, // Slightly increased for potentially more stable initial detection
  /** Minimum confidence score ([0.0, 1.0]) for hand tracking to be considered successful. Higher values improve tracking stability but may cause tracking loss if confidence drops. */
  minTrackingConfidence: 0.75, // Slightly increased for potentially more stable tracking
};

// --- Operational State Machine States ---
const OpsState = {
  IDLE: 'IDLE',                 // Inactive, ready to initialize
  INITIALIZING: 'INITIALIZING', // Setting up camera and MediaPipe
  RUNNING: 'RUNNING',           // Actively processing frames and tracking hands
  CLEANING_UP: 'CLEANING_UP',     // Shutting down and releasing resources
  ERROR: 'ERROR',               // An unrecoverable error occurred
};

// --- Component Styles ---
const styles = {
  video: {
    width: "11%",
    position: "fixed",
    top: "5rem",
    right: "1rem",
    borderRadius: '8px',
    border: '1px solid gray',
    zIndex: 1000, // Ensure video is behind cursor and overlays
    transform: 'scaleX(-1)', // Mirror effect for intuitive user interaction
    visibility: 'visible', // Controlled dynamically
    // Note: Even if hidden, the video stream is required by MediaPipe.
    // Could potentially interfere with `document.elementFromPoint` if z-indices are incorrect elsewhere.
  },
  cursorBase: {
    position: 'fixed',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    pointerEvents: 'none', // Crucial: prevents the cursor from blocking underlying element clicks
    zIndex: 10000, // Ensure cursor is above most page elements
    display: 'block', // Visibility controlled by rendering logic
    transform: 'translate(-50%, -50%)', // Center the cursor div on its coordinates
    transition: `transform ${CLICK_EFFECT_DURATION_MS}ms ease-out, background-color ${CLICK_EFFECT_DURATION_MS}ms ease`, // Smooth visual feedback
  },
  loadingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent background
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 11000, // Above everything else
    color: 'white',
    fontSize: '1.5em',
    fontFamily: 'sans-serif',
    textAlign: 'center',
    padding: '20px',
  }
};

function HandTracker({ enabled }) {
  // --- Refs for DOM elements, MediaPipe/Camera instances, and state persistence ---
  const videoRef = useRef(null);
  const cameraRef = useRef(null); // MediaPipe Camera instance
  const handsRef = useRef(null); // MediaPipe Hands instance
  const handStatesRef = useRef({}); // Stores gesture state per hand index { [handIndex]: { gestureState, lastClickTimestamp, ... } }
  const isMountedRef = useRef(false); // Tracks component mount status to prevent state updates after unmount
  const firstResultReceivedRef = useRef(false); // Flag indicating if the first detection result has been processed
  const operationalStateRef = useRef(OpsState.IDLE); // Mutable ref holding the current operational state for use in callbacks/timeouts
  const initTimeoutRef = useRef(null); // Holds the timeout ID for initialization failure detection
  const instanceIdRef = useRef(0); // Unique ID for each initialization attempt to prevent race conditions with async callbacks

  // --- React State Hooks ---
  const [cursors, setCursors] = useState([]); // Array of cursor data objects { id, x, y, color, scale } to be rendered
  const [operationalState, setOperationalState] = useState(OpsState.IDLE); // Controls the component's current lifecycle phase (IDLE, INITIALIZING, etc.)
  const [loadingMessage, setLoadingMessage] = useState(''); // Message displayed during INITIALIZING and CLEANING_UP states
  const [errorMessage, setErrorMessage] = useState(''); // Error message displayed in the ERROR state

  /** Effect to keep the mutable `operationalStateRef` synchronized with the `operationalState` state variable. */
  useEffect(() => {
    operationalStateRef.current = operationalState;
  }, [operationalState]);

  /** Effect handling component mounting and unmounting. Sets initial state and performs final cleanup. */
  useEffect(() => {
    const videoElement = videoRef.current;
    isMountedRef.current = true;
    setOperationalState(OpsState.IDLE);
    operationalStateRef.current = OpsState.IDLE;

    // Check for media device support and request access
    try {
      if (!('mediaDevices' in navigator) || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        setErrorMessage('Tu navegador no soporta acceso a la cámara/micrófono.');
        setOperationalState(OpsState.ERROR);
        return;
      }
    } catch (e) {
      setErrorMessage('Tu navegador no soporta acceso a la cámara/micrófono.');
      setOperationalState(OpsState.ERROR);
      console.error('Error checking media devices:', e);
      return;
    }

    // Cleanup function executed ONLY on component unmount
    return () => {
      isMountedRef.current = false;
      if (initTimeoutRef.current) { clearTimeout(initTimeoutRef.current); initTimeoutRef.current = null; }
      // Basic cleanup without state management or async waits, as component is gone
      if (cameraRef.current) { try { cameraRef.current.stop(); } catch(e){ console.log("Error while stopping the camera ref"); } } cameraRef.current = null;
      if (handsRef.current) { try { handsRef.current.close(); } catch(e){ console.log("Error while stopping the hands ref"); } } handsRef.current = null;
       if (videoElement?.srcObject) {
           try { videoElement.srcObject.getTracks().forEach(track => track.stop()); } catch(e){ console.log("Error while stopping the video tracks ", e); }
          // Nullify the video stream to prevent memory leaks and ensure no further processing occurs
           videoElement.srcObject = null;
       }
       operationalStateRef.current = OpsState.IDLE; // Ensure ref reflects inactive state on unmount
    };
  }, []); // Empty dependency array ensures this runs only once on mount and unmount

  /**
   * Asynchronously initializes MediaPipe Hands and the camera stream.
   * Manages state transitions from INITIALIZING.
   * @param {number} currentInstanceId - The unique ID for this specific initialization attempt.
   */
  const initializeHandTracking = useCallback(async (currentInstanceId) => {
    // Abort if component unmounted, state changed, or this is an obsolete instance call
    if (!isMountedRef.current ||
        operationalStateRef.current !== OpsState.INITIALIZING ||
        instanceIdRef.current !== currentInstanceId
        ) {
      // If aborted, ensure state consistency if safe
      if (operationalStateRef.current !== OpsState.CLEANING_UP && isMountedRef.current) {
          setOperationalState(OpsState.IDLE);
      }
      return;
    }

    firstResultReceivedRef.current = false;
    if (isMountedRef.current) setLoadingMessage('Configurando detección...');

    try {
      if (!videoRef.current) throw new Error("Video element not found.");
      // Defensive cleanup of previous instances (should be handled by state machine, but belt-and-suspenders)
      if (cameraRef.current) { try { cameraRef.current.stop(); } catch(e){} cameraRef.current = null; }
      if (handsRef.current) { try { await handsRef.current.close(); } catch(e){} handsRef.current = null; }

      // Instantiate MediaPipe Hands
      handsRef.current = new Hands({
        // Provides the path to MediaPipe asset files. Includes instance ID check as a safety measure.
        locateFile: (file) => {
          if (instanceIdRef.current !== currentInstanceId) {
              // Warn if an obsolete instance tries to load files (unlikely but possible race condition)
              console.warn(`HandTracker locateFile: Obsolete instance ID detected (${currentInstanceId} vs ${instanceIdRef.current}).`);
          }
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      const currentHandsInstance = handsRef.current; // Local reference for callbacks

      // Apply MediaPipe options
      currentHandsInstance.setOptions(MEDIAPIPE_HANDS_OPTIONS);

      // --- Helper Functions ---
      /** Calculates Euclidean distance between two 3D landmarks. */
      const getDistance = (p1, p2) => {
        if (!p1 || !p2) return Infinity;
        const dx = p1.x - p2.x; const dy = p1.y - p2.y; const dz = (p1.z || 0) - (p2.z || 0);
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
      };
      /** Determines if thumb and middle finger tips are close enough to signify a click gesture. */
      const areFingersTouching = (landmarks) => {
        if (!landmarks || landmarks.length < 21) return false;
        const thumbTip = landmarks[4]; const middleTip = landmarks[12];
        const distance = getDistance(thumbTip, middleTip);
        return distance < CLICK_DISTANCE_THRESHOLD;
      };
      /** Simulates mouse events (down, up, click) on the element at the specified coordinates. */
      const triggerClick = (x, y, handIndex, originalColor) => {
         const element = document.elementFromPoint(x, y);
         if (element) {
             const commonProps={clientX: x, clientY: y, bubbles: true, cancelable: true, view: window};
             element.dispatchEvent(new MouseEvent('mousedown', commonProps));
             element.dispatchEvent(new MouseEvent('mouseup', commonProps));
             element.dispatchEvent(new MouseEvent('click',{...commonProps, detail: 1}));
             // Trigger visual feedback only if component is still mounted
             if(isMountedRef.current){
                 setCursors(prev => prev.map(c => c.id===handIndex ? {...c, color: CLICK_EFFECT_COLOR, scale: CLICK_EFFECT_SCALE} : c ));
                 setTimeout(() => { if(isMountedRef.current){ setCursors(prev => prev.map(c => c.id===handIndex ? {...c, color: originalColor, scale: 1.0} : c )); } }, CLICK_EFFECT_DURATION_MS);
             }
         }
      };

      // --- MediaPipe Results Callback ---
      currentHandsInstance.onResults((results) => {
        // Ignore results if unmounted, in wrong state, or from an obsolete instance
        if (!isMountedRef.current ||
            (operationalStateRef.current !== OpsState.RUNNING && operationalStateRef.current !== OpsState.INITIALIZING) ||
             instanceIdRef.current !== currentInstanceId ) {
          return;
        }

        // Transition to RUNNING state upon receiving the first valid result
        if (operationalStateRef.current === OpsState.INITIALIZING && !firstResultReceivedRef.current) {
          firstResultReceivedRef.current = true;
          if (initTimeoutRef.current) { clearTimeout(initTimeoutRef.current); initTimeoutRef.current = null; } // Clear init timeout
          if (isMountedRef.current) { setOperationalState(OpsState.RUNNING); }
          return; // Process next frame in RUNNING state
        }

        if (operationalStateRef.current !== OpsState.RUNNING) return; // Only process if RUNNING

        // --- Process landmarks and update cursors ---
        const now = Date.now(); const currentCursorsData = [];
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          results.multiHandLandmarks.forEach((landmarks, index) => {
             if (index >= MAX_HANDS) return;
             const handIndex = index;
             const handColor = HAND_COLORS[handIndex % HAND_COLORS.length];
             // Initialize or retrieve state for this specific hand
             if (!handStatesRef.current[handIndex]) { handStatesRef.current[handIndex] = { gestureState: 'open', lastClickTimestamp: 0, originalColor: handColor, activeClickEffect: false }; }
             const handState = handStatesRef.current[handIndex];
             const indexTip = landmarks[8]; // Use index finger tip for cursor position

             if (indexTip) {
                 const windowWidth = window.innerWidth; const windowHeight = window.innerHeight;
                 const cursorX = windowWidth - (indexTip.x * windowWidth); // Invert X for mirror effect
                 const cursorY = indexTip.y * windowHeight;
                 // Add cursor data for rendering
                 currentCursorsData.push({
                     id: handIndex, x: cursorX, y: cursorY,
                     color: handState.activeClickEffect ? CLICK_EFFECT_COLOR : handState.originalColor,
                     scale: handState.activeClickEffect ? CLICK_EFFECT_SCALE : 1.0,
                 });
                 // Detect click gesture
                 const touching = areFingersTouching(landmarks);
                 if (handState.gestureState === 'open' && touching) { // Open -> Closed transition
                    if (now - handState.lastClickTimestamp > CLICK_COOLDOWN_MS) { // Check cooldown
                        handState.gestureState = 'closed'; handState.lastClickTimestamp = now;
                        handState.activeClickEffect = true; // Start visual effect
                        triggerClick(cursorX, cursorY, handIndex, handState.originalColor);
                    }
                 } else if (handState.gestureState === 'closed' && !touching) { // Closed -> Open transition
                    handState.gestureState = 'open';
                 }
                 // Ensure visual effect resets even if timeout fails (belt-and-suspenders)
                 if (handState.activeClickEffect && now - handState.lastClickTimestamp > CLICK_EFFECT_DURATION_MS) {
                    handState.activeClickEffect = false;
                 }
             }
          });
        }
        // Update React state to re-render cursors
        if (isMountedRef.current) { setCursors(currentCursorsData); }
      }); // End onResults

      // --- Setup and Start Camera ---
      if (isMountedRef.current) setLoadingMessage('Accediendo a la cámara...');
      cameraRef.current = new Camera(videoRef.current, {
        // Camera frame processing callback
        onFrame: async () => {
          // Send frame to MediaPipe only if in the correct state, instance, and refs are valid
          if (isMountedRef.current &&
              (operationalStateRef.current === OpsState.RUNNING || operationalStateRef.current === OpsState.INITIALIZING) &&
              instanceIdRef.current === currentInstanceId &&
              handsRef.current === currentHandsInstance && // Ensure it's the correct Hands instance
              videoRef.current && videoRef.current.readyState >= 3)
          {
             try {
                // `await` ensures error capture but might slightly impact frame rate vs. fire-and-forget.
                await currentHandsInstance.send({ image: videoRef.current });
             } catch (error) {
                // Check state/instance again within catch block due to async nature
                if (isMountedRef.current &&
                    instanceIdRef.current === currentInstanceId &&
                    handsRef.current === currentHandsInstance) {
                    console.error(`HandTracker onFrame [${currentInstanceId}]: Error in send():`, error);
                    // Consider transitioning to ERROR state for persistent errors
                }
             }
          }
        },
        width: 640, height: 480, // Processing resolution
      });

      if (isMountedRef.current) setLoadingMessage('Iniciando cámara...');
      await cameraRef.current.start(); // Start camera stream (may throw permission errors)

      // Final check after camera start to ensure state/instance hasn't changed
      if (!isMountedRef.current ||
          operationalStateRef.current !== OpsState.INITIALIZING ||
          instanceIdRef.current !== currentInstanceId ) {
           // Abort if state changed during camera start
           return;
      }

      if (isMountedRef.current) setLoadingMessage('Cámara iniciada. Esperando detección...');

      // Start initialization timeout watchdog
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = setTimeout(() => {
          // Check state/instance within timeout callback
          if (isMountedRef.current &&
              operationalStateRef.current === OpsState.INITIALIZING &&
              instanceIdRef.current === currentInstanceId ) {
              console.warn(`HandTracker Timeout [${currentInstanceId}]: No results received.`);
              if (isMountedRef.current) { // Final check before state update
                  setErrorMessage("No se pudo iniciar la detección (timeout).");
                  setOperationalState(OpsState.ERROR);
              }
          }
      }, INIT_TIMEOUT_MS);

    } catch (error) {
      console.error(`HandTracker Initialize [${currentInstanceId}]: Critical Error:`, error);
      // Transition to ERROR state only if the error occurred during the expected instance/state
      if (isMountedRef.current &&
          operationalStateRef.current === OpsState.INITIALIZING &&
          instanceIdRef.current === currentInstanceId) {
        setErrorMessage(`Error al iniciar: Ha ocurrido un error inesperado, vuelva a intentarlo más tarde.`);
        setOperationalState(OpsState.ERROR);
      }
    }
  }, []); // useCallback with empty dependencies

  /**
   * Asynchronously stops MediaPipe/Camera and cleans up resources.
   * Manages state transitions from CLEANING_UP to IDLE.
   * @param {string} callerId - Identifier for logging purposes (who initiated the cleanup).
   */
  const cleanup = useCallback(async (callerId) => {
    const cleanupStartTime = Date.now();

    // Abort if not in CLEANING_UP state
    if (operationalStateRef.current !== OpsState.CLEANING_UP) {
      return; // Avoid cleanup if state changed unexpectedly
    }

    // Clear any pending initialization timeout
    if (initTimeoutRef.current) { clearTimeout(initTimeoutRef.current); initTimeoutRef.current = null; }

    // Update UI if mounted
    if (isMountedRef.current) {
       setLoadingMessage('Desactivando...');
       setCursors([]); // Hide cursors
    }
    handStatesRef.current = {}; // Clear internal hand states

    // --- Resource Release ---
    // Use local copies and nullify global refs immediately to signal unavailability

    // 1. Camera
    const cam = cameraRef.current; cameraRef.current = null;
    if (cam) { try { cam.stop(); } catch (e) { /* Log minor error */ } }

    // 2. Hands Instance (most critical)
    const hnds = handsRef.current;
    // Attempt to deregister callback *before* nullifying/closing
    if (hnds) { try { hnds.onResults(null); } catch(e) {} }
    handsRef.current = null; // Nullify ref
    if (hnds && typeof hnds.close === 'function') {
      try { await hnds.close(); } // Attempt graceful close
      catch (error) { console.error(`[${callerId}] Error closing Hands:`, error); }
    }

    // 3. Video Tracks
    const vid = videoRef.current;
    if (vid && vid.srcObject) { try { vid.srcObject.getTracks().forEach(t => t.stop()); vid.srcObject = null; } catch(e){} }

    // --- Enforce Minimum Cleanup Duration ---
    // Wait to ensure internal async operations (like asset loading/XHR) have likely settled or failed
    const elapsedTime = Date.now() - cleanupStartTime;
    const delayNeeded = Math.max(0, MIN_CLEANUP_DURATION_MS - elapsedTime);
    if (delayNeeded > 0) {
        await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }

    // --- Final State Transition ---
    // Transition to IDLE only if still mounted and still in CLEANING_UP state
    if (isMountedRef.current && operationalStateRef.current === OpsState.CLEANING_UP) {
       // Apply a short visual delay before hiding the "Desactivando..." message
       setTimeout(() => {
            if (isMountedRef.current && operationalStateRef.current === OpsState.CLEANING_UP) {
                setOperationalState(OpsState.IDLE); // Final transition
            }
       }, VISUAL_CLEANUP_DELAY_MS);
    }
    // If state changed during cleanup/wait, the new state logic takes precedence
  }, []); // useCallback with empty dependencies

  /** Effect reacting to changes in the `enabled` prop to request state transitions. */
  useEffect(() => {
    const currentOpState = operationalStateRef.current;
    if (!isMountedRef.current) return; // Ignore if unmounted

    if (enabled) {
      // Request INITIALIZING state if currently IDLE or in ERROR
      if (currentOpState === OpsState.IDLE || currentOpState === OpsState.ERROR) {
        instanceIdRef.current += 1; // Increment instance ID for the new attempt
        setErrorMessage(''); // Clear previous errors
        setOperationalState(OpsState.INITIALIZING); // Request initialization
      }
      // If enabled while CLEANING_UP, wait for it to finish (will transition to IDLE)
    } else { // enabled: false
      // Request CLEANING_UP state if currently RUNNING or INITIALIZING
      if (currentOpState === OpsState.RUNNING || currentOpState === OpsState.INITIALIZING) {
        setOperationalState(OpsState.CLEANING_UP); // Request cleanup
      }
    }
  }, [enabled]); // Dependency: only the enabled prop

  /** Effect reacting to changes in `operationalState` to execute the corresponding async actions. */
  useEffect(() => {
    if (!isMountedRef.current) return;

    const currentInstanceId = instanceIdRef.current; // Capture instance ID for async calls

    if (operationalState === OpsState.INITIALIZING) {
      initializeHandTracking(currentInstanceId); // Pass current instance ID
    } else if (operationalState === OpsState.CLEANING_UP) {
      cleanup(`StateEffect (OpState=${operationalState})`); // Execute cleanup
    } else if (operationalState === OpsState.ERROR) {
      // Optional: Could trigger cleanup on entering ERROR state if desired
      //cleanup("StateEffect (ERROR)");
    }

  }, [operationalState, initializeHandTracking, cleanup]); // Dependencies ensure correct functions are called

  // --- Derive Booleans for Conditional Rendering ---
  const showLoading = operationalState === OpsState.INITIALIZING || operationalState === OpsState.CLEANING_UP;
  const showError = operationalState === OpsState.ERROR && !!errorMessage;
  // Show video/cursors only when fully operational (RUNNING state)
  const showVideo = operationalState === OpsState.RUNNING;
  const showCursors = operationalState === OpsState.RUNNING && cursors.length > 0;

  // --- Component Render ---
  return (
    <>
      {/* Loading State Overlay */}
      {showLoading && (
        <div style={styles.loadingOverlay}>
          {loadingMessage || 'Procesando...'}
        </div>
      )}

      {/* Error State Overlay */}
      {showError && (
         <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(150,0,0,0.85)', color: 'white', padding: '10px 20px', borderRadius: 8, zIndex: 12000, fontSize: '1em', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            {errorMessage}
            <button
                onClick={() => {
                    setErrorMessage('');
                    setOperationalState(OpsState.IDLE);
                }}
                style={{ marginLeft: '15px', padding: '5px 10px', cursor: 'pointer', border: 'none', background: 'rgba(255,255,255,0.2)', color: 'white', borderRadius: 4 }}
            >
                Cerrar
            </button>
         </div>
      )}

      {/* Video Element (required by MediaPipe, visibility controlled) */}
      <video
        ref={videoRef}
        playsInline autoPlay muted
        data-testid="handtracker-video"
        style={{
            ...styles.video,
            visibility: showVideo ? 'visible' : 'hidden' // Show only when running
         }}
      />

      {/* Hand Cursors (rendered only when running and cursors exist) */}
      {showCursors && cursors.map(cursor => (
        <div
          key={cursor.id} // Unique key for React rendering
          data-hand-cursor // Custom attribute for potential selection/styling
          style={{
            ...styles.cursorBase, // Base cursor styles
            left: `${cursor.x}px`, // Dynamic position
            top: `${cursor.y}px`,  // Dynamic position
            backgroundColor: cursor.color, // Dynamic color
            transform: `translate(-50%, -50%) scale(${cursor.scale})`, // Centering and click animation scale
          }}
        />
      ))}
    </>
  );
}

HandTracker.propTypes = {
  enabled: PropTypes.bool.isRequired,
};

export default HandTracker;