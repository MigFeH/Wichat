import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

// --- Constantes Configurables ---
const CLICK_DISTANCE_THRESHOLD = 0.05;
const CLICK_COOLDOWN_MS = 500;
const MAX_HANDS = 4;
const HAND_COLORS = ['red', 'lime', 'cyan', 'yellow', 'magenta', 'orange'];
const CLICK_EFFECT_COLOR = 'blue';
const CLICK_EFFECT_SCALE = 1.5;
const CLICK_EFFECT_DURATION_MS = 150;
const INIT_TIMEOUT_MS = 20000;
// *** Aumentar significativamente el tiempo mínimo que pasamos en CLEANING_UP ***
const MIN_CLEANUP_DURATION_MS = 750; // Forzar casi 1 segundo de espera en limpieza
const VISUAL_CLEANUP_DELAY_MS = 100; // Delay visual corto al final

// --- Tipos de Estado Operacional ---
const OpsState = { /* ... (sin cambios) ... */
  IDLE: 'IDLE', INITIALIZING: 'INITIALIZING', RUNNING: 'RUNNING',
  CLEANING_UP: 'CLEANING_UP', ERROR: 'ERROR',
};

// --- Estilos CSS ---
const styles = { /* ... (sin cambios) ... */
  video: { position: 'fixed', bottom: '10px', left: '10px', width: '160px', height: '120px', borderRadius: '8px', border: '1px solid gray', zIndex: 1000, transform: 'scaleX(-1)', visibility: 'visible' },
  cursorBase: { position: 'fixed', width: '20px', height: '20px', borderRadius: '50%', pointerEvents: 'none', zIndex: 10000, display: 'block', transform: 'translate(-50%, -50%)', transition: `transform ${CLICK_EFFECT_DURATION_MS}ms ease-out, background-color ${CLICK_EFFECT_DURATION_MS}ms ease` },
  loadingOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 11000, color: 'white', fontSize: '1.5em', fontFamily: 'sans-serif', textAlign: 'center', padding: '20px' }
};


// --- Componente Principal ---
function HandTracker({ enabled }) {
  // --- Refs ---
  const videoRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);
  const handStatesRef = useRef({});
  const isMountedRef = useRef(false);
  const firstResultReceivedRef = useRef(false);
  const operationalStateRef = useRef(OpsState.IDLE);
  const initTimeoutRef = useRef(null);
  // *** Ref para un ID de instancia único, cambia cada inicialización ***
  const instanceIdRef = useRef(0);


  // --- Estados ---
  const [cursors, setCursors] = useState([]);
  const [operationalState, setOperationalState] = useState(OpsState.IDLE);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // --- Sincronizar Ref con Estado Operacional ---
  useEffect(() => {
    operationalStateRef.current = operationalState;
    console.log(`HandTracker State Change: New State = ${operationalState}`);
  }, [operationalState]);

  // --- Efecto para manejar el Montaje/Desmontaje ---
  useEffect(() => {
    isMountedRef.current = true;
    console.log("HandTracker: Componente Montado.");
    setOperationalState(OpsState.IDLE);
    operationalStateRef.current = OpsState.IDLE;

    return () => {
      isMountedRef.current = false;
      console.log("HandTracker: Componente Desmontándose.");
      if (initTimeoutRef.current) { clearTimeout(initTimeoutRef.current); initTimeoutRef.current = null; }
      // Limpieza básica de refs al desmontar (sin await, sin manejo de estado)
      if (cameraRef.current) { try { cameraRef.current.stop(); } catch(e){} } cameraRef.current = null;
      if (handsRef.current) { try { handsRef.current.close(); } catch(e){} } handsRef.current = null;
       if (videoRef.current && videoRef.current.srcObject) {
           try { videoRef.current.srcObject.getTracks().forEach(track => track.stop()); } catch(e){}
           videoRef.current.srcObject = null;
       }
       operationalStateRef.current = OpsState.IDLE; // Forzar estado IDLE en ref al desmontar
    };
  }, []);

  // --- Función de Inicialización Asíncrona ---
  const initializeHandTracking = useCallback(async (currentInstanceId) => {
    console.log(`HandTracker Initialize: Iniciando proceso para instancia ${currentInstanceId}...`);
    // Verificar estado, montaje e ID de instancia
    if (!isMountedRef.current ||
        operationalStateRef.current !== OpsState.INITIALIZING ||
        instanceIdRef.current !== currentInstanceId // *** Verificar que seguimos en la misma instancia solicitada ***
        ) {
      console.log(`HandTracker Initialize: Abortado (no montado, estado incorrecto, o ID obsoleto ${currentInstanceId} != ${instanceIdRef.current}). Estado actual: ${operationalStateRef.current}`);
      if (operationalStateRef.current !== OpsState.CLEANING_UP) {
         // Solo volver a IDLE si no estamos ya limpiando (evitar conflicto)
         if (isMountedRef.current) setOperationalState(OpsState.IDLE);
      }
      return;
    }

    firstResultReceivedRef.current = false;
    if (isMountedRef.current) setLoadingMessage('Configurando detección...'); // Actualizar estado solo si está montado

    try {
      if (!videoRef.current) throw new Error("Elemento de video no encontrado.");
      // Limpieza previa de refs (redundante pero seguro)
      if (cameraRef.current) { try { cameraRef.current.stop(); } catch(e){} cameraRef.current = null; }
      if (handsRef.current) { try { await handsRef.current.close(); } catch(e){} handsRef.current = null; }

      console.log(`HandTracker Initialize [${currentInstanceId}]: Configurando MediaPipe Hands...`);
      handsRef.current = new Hands({
        // *** Modificar locateFile para usar el ID de instancia ***
        locateFile: (file) => {
          // Si esta función es llamada por un proceso obsoleto, el ID no coincidirá
          if (instanceIdRef.current !== currentInstanceId) {
              console.warn(`HandTracker locateFile: ID obsoleto detectado (${currentInstanceId} vs ${instanceIdRef.current}). Abortando carga de ${file}`);
              // Lanzar un error podría ser demasiado agresivo, ¿devolver null?
              // O simplemente loguear y devolver la URL normal. Probemos loguear.
              // throw new Error("Obsolete instance ID in locateFile");
          }
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      // *** Guardar la instancia actual en la ref ANTES de llamar a setOptions/onResults ***
      // Esto asegura que onResults tenga la referencia correcta si se dispara muy rápido
      const currentHandsInstance = handsRef.current;

      currentHandsInstance.setOptions({
        maxNumHands: MAX_HANDS, modelComplexity: 1,
        minDetectionConfidence: 0.7, minTrackingConfidence: 0.7,
      });

      // --- Funciones Auxiliares ---
      const getDistance = (p1, p2) => { /* ... */ if (!p1 || !p2) return Infinity; const dx = p1.x - p2.x; const dy = p1.y - p2.y; const dz = (p1.z || 0) - (p2.z || 0); return Math.sqrt(dx*dx + dy*dy + dz*dz); };
      const areFingersTouching = (landmarks) => { /* ... */ if (!landmarks || landmarks.length < 21) return false; const thumbTip = landmarks[4]; const middleTip = landmarks[12]; const distance = getDistance(thumbTip, middleTip); return distance < CLICK_DISTANCE_THRESHOLD; };
      const triggerClick = (x, y, handIndex, originalColor) => { /* ... */ const element = document.elementFromPoint(x, y); console.log(`Hand[${handIndex}] Click attempt (${x.toFixed(0)},${y.toFixed(0)}):`, element); if (element) { const commonProps={clientX: x, clientY: y, bubbles: true, cancelable: true, view: window}; element.dispatchEvent(new MouseEvent('mousedown', commonProps)); element.dispatchEvent(new MouseEvent('mouseup', commonProps)); element.dispatchEvent(new MouseEvent('click',{...commonProps, detail: 1})); if(isMountedRef.current){ setCursors(prev => prev.map(c => c.id===handIndex ? {...c, color: CLICK_EFFECT_COLOR, scale: CLICK_EFFECT_SCALE} : c )); setTimeout(() => { if(isMountedRef.current){ setCursors(prev => prev.map(c => c.id===handIndex ? {...c, color: originalColor, scale: 1.0} : c )); } }, CLICK_EFFECT_DURATION_MS); } } };

      // --- Callback de Resultados ---
      currentHandsInstance.onResults((results) => {
         // *** Verificar ID de instancia además de estado y montaje ***
        if (!isMountedRef.current ||
            (operationalStateRef.current !== OpsState.RUNNING && operationalStateRef.current !== OpsState.INITIALIZING) ||
             instanceIdRef.current !== currentInstanceId // Asegurar que el resultado es de la instancia actual
            ) {
          // Ignorar resultados obsoletos o si ya no estamos en el estado correcto
          return;
        }

        if (operationalStateRef.current === OpsState.INITIALIZING && !firstResultReceivedRef.current) {
          console.log(`HandTracker onResults [${currentInstanceId}]: Primer resultado! Transicionando a RUNNING.`);
          firstResultReceivedRef.current = true;
          if (initTimeoutRef.current) { clearTimeout(initTimeoutRef.current); initTimeoutRef.current = null; }
          if (isMountedRef.current) { setOperationalState(OpsState.RUNNING); }
          return; // Salir, procesar desde el siguiente frame en estado RUNNING
        }

        if (operationalStateRef.current !== OpsState.RUNNING) return; // Ignorar si no estamos corriendo

        // --- Lógica de Procesamiento (igual) ---
        const now = Date.now(); const currentCursorsData = [];
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          results.multiHandLandmarks.forEach((landmarks, index) => {
             if (index >= MAX_HANDS) return; const handIndex = index; const handColor = HAND_COLORS[handIndex % HAND_COLORS.length];
             if (!handStatesRef.current[handIndex]) { handStatesRef.current[handIndex] = { gestureState: 'open', lastClickTimestamp: 0, originalColor: handColor, activeClickEffect: false }; }
             const handState = handStatesRef.current[handIndex]; const indexTip = landmarks[8];
             if (indexTip) { const windowWidth = window.innerWidth; const windowHeight = window.innerHeight; const cursorX = windowWidth - (indexTip.x * windowWidth); const cursorY = indexTip.y * windowHeight; currentCursorsData.push({ id: handIndex, x: cursorX, y: cursorY, color: handState.activeClickEffect ? CLICK_EFFECT_COLOR : handState.originalColor, scale: handState.activeClickEffect ? CLICK_EFFECT_SCALE : 1.0 }); const touching = areFingersTouching(landmarks); if (handState.gestureState === 'open' && touching) { if (now - handState.lastClickTimestamp > CLICK_COOLDOWN_MS) { console.log(`Hand[${handIndex}] Click DETECTED.`); handState.gestureState = 'closed'; handState.lastClickTimestamp = now; handState.activeClickEffect = true; triggerClick(cursorX, cursorY, handIndex, handState.originalColor); } } else if (handState.gestureState === 'closed' && !touching) { handState.gestureState = 'open'; } if (handState.activeClickEffect && now - handState.lastClickTimestamp > CLICK_EFFECT_DURATION_MS) { handState.activeClickEffect = false; } }
          });
        }
        if (isMountedRef.current) { setCursors(currentCursorsData); }
      }); // Fin onResults


      // --- Configuración e Inicio de la Cámara ---
      console.log(`HandTracker Initialize [${currentInstanceId}]: Configurando la cámara...`);
      if (isMountedRef.current) setLoadingMessage('Accediendo a la cámara...');
      cameraRef.current = new Camera(videoRef.current, {
        onFrame: async () => {
          // *** Verificar ID de instancia en onFrame también ***
          if (isMountedRef.current &&
              (operationalStateRef.current === OpsState.RUNNING || operationalStateRef.current === OpsState.INITIALIZING) &&
              instanceIdRef.current === currentInstanceId && // Verificar instancia
              handsRef.current && // Verificar que la ref global apunta a la instancia esperada (o al menos no es null)
              handsRef.current === currentHandsInstance && // Más específico: ¿es la misma instancia?
              videoRef.current && videoRef.current.readyState >= 3)
          {
             try {
                // No usar await aquí podría ser ligeramente más seguro contra bloqueos,
                // pero dificulta saber si send() falló internamente. Mantenemos await por ahora.
                await currentHandsInstance.send({ image: videoRef.current });
             } catch (error) {
                // Verificar refs y estado de nuevo DENTRO del catch
                if (isMountedRef.current &&
                    instanceIdRef.current === currentInstanceId &&
                    handsRef.current === currentHandsInstance) {
                    console.error(`HandTracker onFrame [${currentInstanceId}]: Error en send():`, error);
                    // setErrorMessage("Error procesando imagen."); // Quizás no fatal
                    // setOperationalState(OpsState.ERROR); // Transición a error podría ser opción
                } else {
                   console.warn(`HandTracker onFrame [${currentInstanceId}]: Error en send() ignorado (estado/instancia obsoleta).`);
                }
             }
          }
        },
        width: 640, height: 480,
      });

      console.log(`HandTracker Initialize [${currentInstanceId}]: Iniciando la cámara...`);
      if (isMountedRef.current) setLoadingMessage('Iniciando cámara...');
      await cameraRef.current.start(); // Esperar inicio

      // Verificar estado e ID de nuevo DESPUÉS de iniciar cámara
      if (!isMountedRef.current ||
          operationalStateRef.current !== OpsState.INITIALIZING ||
          instanceIdRef.current !== currentInstanceId ) {
           console.log(`HandTracker Initialize [${currentInstanceId}]: Estado/ID cambió durante inicio de cámara. Abortando/Limpiando.`);
           // La lógica del estado/cleanup debería manejar esto
           return;
      }

      console.log(`HandTracker Initialize [${currentInstanceId}]: Cámara iniciada. Esperando primer resultado...`);
      if (isMountedRef.current) setLoadingMessage('Cámara iniciada. Esperando detección...');

      // Iniciar timeout
       if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
       initTimeoutRef.current = setTimeout(() => {
           // Verificar estado, montaje e ID en el timeout
           if (isMountedRef.current &&
               operationalStateRef.current === OpsState.INITIALIZING &&
               instanceIdRef.current === currentInstanceId ) {
               console.warn(`HandTracker Timeout [${currentInstanceId}]: No se recibieron resultados.`);
               if (isMountedRef.current) { // Chequeo extra antes de setear estado
                   setErrorMessage("No se pudo iniciar la detección (timeout).");
                   setOperationalState(OpsState.ERROR);
               }
           }
       }, INIT_TIMEOUT_MS);

    } catch (error) {
      console.error(`HandTracker Initialize [${currentInstanceId}]: Error CRÍTICO:`, error);
      // Verificar estado, montaje e ID antes de setear error
      if (isMountedRef.current &&
          operationalStateRef.current === OpsState.INITIALIZING &&
          instanceIdRef.current === currentInstanceId) {
        setErrorMessage(`Error al iniciar: ${error.message || 'Desconocido'}.`);
        setOperationalState(OpsState.ERROR);
      } else {
         console.log(`HandTracker Initialize [${currentInstanceId}]: Error crítico ocurrió, pero el estado/ID ya no coincide. Error no seteado.`);
      }
    }
  }, []); // useCallback con dependencias vacías

  // --- Función de Limpieza Asíncrona ---
  const cleanup = useCallback(async (callerId) => { // Recibe un ID opcional para logging
    const cleanupStartTime = Date.now();
    console.log(`HandTracker Cleanup [Caller: ${callerId}]: Iniciando proceso... Estado actual: ${operationalStateRef.current}`);

    // Verificar estado y montaje (Permitir cleanup incluso si no está montado, para liberar refs)
    if (operationalStateRef.current !== OpsState.CLEANING_UP) {
      console.log(`HandTracker Cleanup [Caller: ${callerId}]: Abortado (estado incorrecto ${operationalStateRef.current}).`);
      // Si el estado no es CLEANING_UP, no deberíamos estar aquí. Quizás volver a IDLE si es seguro?
      // O simplemente no hacer nada si ya está en IDLE o ERROR.
      if (isMountedRef.current &&
          operationalStateRef.current !== OpsState.INITIALIZING &&
          operationalStateRef.current !== OpsState.RUNNING) {
         // setOperationalState(OpsState.IDLE); // Puede ser peligroso si hay otra operación
      }
      return;
    }

    // Limpiar timeout de inicialización
    if (initTimeoutRef.current) { clearTimeout(initTimeoutRef.current); initTimeoutRef.current = null; console.log(`HandTracker Cleanup [Caller: ${callerId}]: Timeout limpiado.`); }

    // Actualizar UI si está montado
    if (isMountedRef.current) {
       setLoadingMessage('Desactivando...');
       setCursors([]);
    }
    handStatesRef.current = {};

    // --- Intentar limpiar recursos ---
    // 1. Cámara
    const cam = cameraRef.current; cameraRef.current = null;
    if (cam) { console.log(`HandTracker Cleanup [Caller: ${callerId}]: Deteniendo cámara...`); try { cam.stop(); } catch (e) { console.warn(`[${callerId}] Error menor stop cam:`, e); } }

    // 2. Hands (más delicado)
    const hnds = handsRef.current;
    if (hnds) {
        // *** Intentar desregistrar onResults ANTES de anular ref y llamar a close ***
        try { hnds.onResults(null); console.log(`[${callerId}] onResults desregistrado.`); } catch(e) {}
    }
    handsRef.current = null; // Anular ref global
    if (hnds && typeof hnds.close === 'function') {
      console.log(`HandTracker Cleanup [Caller: ${callerId}]: Cerrando Hands...`);
      try { await hnds.close(); console.log(`[${callerId}] Hands cerrado.`); }
      catch (error) { console.error(`[${callerId}] Error al cerrar Hands:`, error); }
    }

    // 3. Video Tracks
    const vid = videoRef.current;
    if (vid && vid.srcObject) { console.log(`[${callerId}] Deteniendo video tracks...`); try { vid.srcObject.getTracks().forEach(t => t.stop()); vid.srcObject = null; } catch(e){} }

    // *** Forzar espera mínima ***
    const elapsedTime = Date.now() - cleanupStartTime;
    const delayNeeded = Math.max(0, MIN_CLEANUP_DURATION_MS - elapsedTime);
    if (delayNeeded > 0) {
        console.log(`HandTracker Cleanup [Caller: ${callerId}]: Esperando ${delayNeeded}ms adicionales...`);
        await new Promise(resolve => setTimeout(resolve, delayNeeded));
    }

    console.log(`HandTracker Cleanup [Caller: ${callerId}]: Limpieza lógica completada. Transicionando a IDLE.`);
    // Transicionar a IDLE sólo si seguimos en CLEANING_UP y montados
    if (isMountedRef.current && operationalStateRef.current === OpsState.CLEANING_UP) {
       // Usar un pequeño delay visual final opcional
       setTimeout(() => {
            if (isMountedRef.current && operationalStateRef.current === OpsState.CLEANING_UP) {
                console.log(`HandTracker Cleanup [Caller: ${callerId}]: Transición final a IDLE.`);
                setOperationalState(OpsState.IDLE);
            }
       }, VISUAL_CLEANUP_DELAY_MS);

    } else if (isMountedRef.current) {
        console.log(`HandTracker Cleanup [Caller: ${callerId}]: Estado cambió durante limpieza/espera. Estado actual: ${operationalStateRef.current}`);
        // Si cambió, no forzamos IDLE. La nueva lógica de estado debería prevalecer.
    } else {
        // Si no está montado, la ref ya se seteó a IDLE en el cleanup de desmontaje.
        console.log(`HandTracker Cleanup [Caller: ${callerId}]: Componente desmontado durante limpieza.`);
    }
  }, []); // useCallback

  // --- Efecto para Reaccionar a Cambios en `enabled` ---
  useEffect(() => {
    const currentOpState = operationalStateRef.current; // Capturar estado actual
    console.log(`HandTracker Enabled Change: enabled=${enabled}, currentState=${currentOpState}`);
    if (!isMountedRef.current) return;

    if (enabled) {
      if (currentOpState === OpsState.IDLE || currentOpState === OpsState.ERROR) {
        console.log("HandTracker Enabled Change: Solicitando transición a INITIALIZING.");
        instanceIdRef.current += 1; // *** Incrementar ID para la nueva instancia ***
        setErrorMessage('');
        setOperationalState(OpsState.INITIALIZING);
      } else if (currentOpState === OpsState.CLEANING_UP) {
         console.log("HandTracker Enabled Change: Habilitado durante limpieza. Se esperará a que termine.");
         // No hacer nada, la transición a IDLE al final de cleanup permitirá re-evaluar.
      } else { /* Ya INITIALIZING o RUNNING */ }
    } else { // enabled: false
      if (currentOpState === OpsState.RUNNING || currentOpState === OpsState.INITIALIZING) {
        console.log(`HandTracker Enabled Change: Solicitando transición a CLEANING_UP desde ${currentOpState}.`);
        setOperationalState(OpsState.CLEANING_UP);
      } else { /* Ya IDLE, CLEANING_UP o ERROR */ }
    }
  }, [enabled]); // Solo depende de enabled

  // --- Efecto para Ejecutar Acciones Basadas en Estado Operacional ---
  useEffect(() => {
    if (!isMountedRef.current) return;

    // Capturar el ID de instancia actual cuando el estado cambia
    const currentInstanceId = instanceIdRef.current;

    if (operationalState === OpsState.INITIALIZING) {
      console.log(`HandTracker State Effect: Ejecutando initializeHandTracking para instancia ${currentInstanceId}...`);
      initializeHandTracking(currentInstanceId); // Pasar ID de instancia
    } else if (operationalState === OpsState.CLEANING_UP) {
      console.log(`HandTracker State Effect: Ejecutando cleanup [Caller: StateEffect]...`);
      cleanup(`StateEffect (OpState=${operationalState})`); // Pasar caller
    } else if (operationalState === OpsState.ERROR) {
        console.log("HandTracker State Effect: Entrando en estado ERROR.");
        // Podríamos forzar una limpieza aquí también si queremos asegurar recursos liberados en error
        // cleanup("StateEffect (ERROR)"); // OJO: Podría causar bucle si cleanup falla y vuelve a ERROR
    }

  }, [operationalState, initializeHandTracking, cleanup]); // Depende del estado y las funciones memoizadas

  // --- Determinar Estado Visual ---
  const showLoading = operationalState === OpsState.INITIALIZING || operationalState === OpsState.CLEANING_UP;
  const showError = operationalState === OpsState.ERROR && !!errorMessage;
  const showVideo = /*enabled &&*/ operationalState === OpsState.RUNNING; // Mostrar solo si está corriendo
  const showCursors = /*enabled &&*/ operationalState === OpsState.RUNNING && cursors.length > 0;

  // --- Renderizado ---
  return (
    <>
      {showLoading && <div style={styles.loadingOverlay}>{loadingMessage || 'Procesando...'}</div>}
      {showError && (
         <div style={{ ...styles.loadingOverlay, backgroundColor: 'rgba(150, 0, 0, 0.8)' }}>
            Error: {errorMessage}
            <button onClick={() => { setErrorMessage(''); setOperationalState(OpsState.IDLE); }} style={{ marginLeft: '15px', padding: '5px 10px', cursor: 'pointer' }}>Entendido</button>
         </div>
      )}
      <video ref={videoRef} playsInline autoPlay muted style={{...styles.video, visibility: showVideo ? 'visible' : 'hidden' }} />
      {showCursors && cursors.map(cursor => ( <div key={cursor.id} data-hand-cursor style={{...styles.cursorBase, left: `${cursor.x}px`, top: `${cursor.y}px`, backgroundColor: cursor.color, transform: `translate(-50%, -50%) scale(${cursor.scale})` }} /> ))}
    </>
  );
}

export default HandTracker;