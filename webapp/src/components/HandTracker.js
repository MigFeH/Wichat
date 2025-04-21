import React, { useRef, useEffect } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

// --- Constantes ---
const CLICK_DISTANCE_THRESHOLD = 0.05; // Umbral para detectar el "toque"
const CLICK_COOLDOWN_MS = 500; // Milisegundos de espera después de un clic antes de permitir otro

function HandTracker({ enabled }) {
  const videoRef = useRef(null);
  const cursorRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);

  // Estado del gesto ('open', 'closed')
  const gestureStateRef = useRef('open');
  // Timestamp del último clic válido para el cooldown
  const lastClickTimestampRef = useRef(0);
  // Flag para saber si la mano está detectada (para ocultar cursor si no hay mano)
  const handDetectedRef = useRef(false);

  useEffect(() => {
    // --- Cleanup inicial y manejo de desactivación ---
    const cleanup = () => {
      console.log("HandTracker cleanup triggered.");
      if (cameraRef.current) {
        console.log("Stopping camera...");
        cameraRef.current.stop();
        cameraRef.current = null; // Ayuda al garbage collector
      }
      if (handsRef.current) {
        console.log("Closing Hands instance...");
        handsRef.current.close();
        handsRef.current = null;
      }
      if (cursorRef.current) {
        cursorRef.current.style.display = 'none';
      }
       // Asegúrate de que el video se detenga también explícitamente
       if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
       }
    };

    if (!enabled) {
      cleanup();
      return; // Salir si no está habilitado
    }

    // --- Inicialización si está habilitado ---
    console.log("Initializing HandTracker...");
    let didInitialize = false; // Flag para evitar doble inicialización en StrictMode

    const initializeHandTracking = async () => {
      if (didInitialize || !videoRef.current) return; // Evitar re-inicialización
      didInitialize = true;
      console.log("Setting up MediaPipe Hands...");

      // Asegurarse de que el cursor se muestre al inicio (si está habilitado)
      if (cursorRef.current) {
          cursorRef.current.style.display = 'none'; // Empezar oculto hasta detectar mano
      }
      handDetectedRef.current = false; // Resetear detección de mano

      handsRef.current = new Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      handsRef.current.setOptions({
        maxNumHands: 2,
        modelComplexity: 1, // Puedes probar 0 para mejor rendimiento si es necesario
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      // --- Lógica de detección de dedos ---
      function getDistance(p1, p2) {
          if (!p1 || !p2) return Infinity; // Si falta algún punto, distancia infinita
          return Math.sqrt(
              Math.pow(p1.x - p2.x, 2) +
              Math.pow(p1.y - p2.y, 2) +
              Math.pow((p1.z || 0) - (p2.z || 0), 2) // Incluir Z puede dar más estabilidad
          );
      }

      function areFingersTouching(landmarks) {
        if (!landmarks || landmarks.length < 21) return false; // Asegurar que tenemos todos los landmarks
        const thumbTip = landmarks[4]; // Punta del pulgar
        const middleTip = landmarks[12]; // Punta del dedo corazón (o índice si prefieres: 8)

        const distance = getDistance(thumbTip, middleTip);
        // console.log("Distance:", distance); // Descomentar para depurar el umbral
        return distance < CLICK_DISTANCE_THRESHOLD;
      }

      // --- Callback de Resultados de MediaPipe ---
      handsRef.current.onResults((results) => {
        const now = Date.now();

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          handDetectedRef.current = true;
          if (cursorRef.current) {
            cursorRef.current.style.display = 'block'; // Mostrar cursor si hay mano
          }

          const landmarks = results.multiHandLandmarks[0];
          const indexTip = landmarks[8]; // Punta del dedo índice para posición

          if (indexTip) {
              const windowWidth = window.innerWidth;
              const windowHeight = window.innerHeight;

              // Invertir la coordenada X para efecto espejo
              const cursorX = windowWidth - (indexTip.x * windowWidth);
              const cursorY = indexTip.y * windowHeight;

              // Actualizar posición del cursor (centrado)
              if (cursorRef.current) {
                  cursorRef.current.style.left = `${cursorX}px`;
                  cursorRef.current.style.top = `${cursorY}px`;
              }

              // --- Lógica del Clic con Cooldown ---
              const touching = areFingersTouching(landmarks);

              // Transición: Abierto -> Cerrado (Inicio del gesto de clic)
              if (gestureStateRef.current === 'open' && touching) {
                // Verificar si ha pasado suficiente tiempo desde el último clic
                if (now - lastClickTimestampRef.current > CLICK_COOLDOWN_MS) {
                  console.log("Click gesture detected!");
                  gestureStateRef.current = 'closed'; // Marcar como cerrado (en proceso de clic)
                  lastClickTimestampRef.current = now; // Registrar el tiempo de este clic
                  triggerClick(cursorX, cursorY);
                } else {
                   // console.log("Cooldown active, click ignored."); // Descomentar para depurar
                }
              }
              // Transición: Cerrado -> Abierto (Fin del gesto)
              else if (gestureStateRef.current === 'closed' && !touching) {
                gestureStateRef.current = 'open'; // Volver al estado abierto, listo para el próximo clic
              }
          }

        } else {
           // No se detectaron manos
           if (handDetectedRef.current) {
              handDetectedRef.current = false;
              if (cursorRef.current) {
                  cursorRef.current.style.display = 'none'; // Ocultar cursor si se pierde la mano
              }
              gestureStateRef.current = 'open'; // Resetear estado si se pierde la mano
           }
        }
      });

      // --- Configuración de la Cámara ---
      if (videoRef.current) {
        console.log("Setting up camera...");
        cameraRef.current = new Camera(videoRef.current, {
          onFrame: async () => {
            // Asegurarse de que el video esté listo y Hands esté inicializado
            if (videoRef.current && videoRef.current.readyState >= 3 && handsRef.current) {
               try {
                  await handsRef.current.send({ image: videoRef.current });
               } catch (error) {
                  console.error("Error sending frame to MediaPipe:", error);
                  // Podrías intentar reiniciar o manejar el error aquí
               }
            }
          },
          width: 640,
          height: 480,
        });
        console.log("Starting camera...");
        await cameraRef.current.start();
        console.log("Camera started.");
      }

    };

    // --- Función para simular el clic ---
    function triggerClick(x, y) {
      console.log(`Attempting click at (${x.toFixed(0)}, ${y.toFixed(0)})`);
      const element = document.elementFromPoint(x, y);
      console.log("Element found:", element);

      if (element) {
        const clickEvent = new MouseEvent('click', {
          clientX: x,
          clientY: y,
          bubbles: true,
          cancelable: true,
          view: window,
          detail: 1 // Usualmente 1 para clics simulados
        });
        // Simular un mousedown y mouseup también puede ser más robusto para algunas UIs
        const mouseDownEvent = new MouseEvent('mousedown', { clientX: x, clientY: y, bubbles: true, cancelable: true, view: window });
        const mouseUpEvent = new MouseEvent('mouseup', { clientX: x, clientY: y, bubbles: true, cancelable: true, view: window });

        element.dispatchEvent(mouseDownEvent);
        element.dispatchEvent(mouseUpEvent);
        element.dispatchEvent(clickEvent);
        console.log("Click event dispatched.");

        // Efecto visual en el cursor
        if (cursorRef.current) {
          cursorRef.current.style.backgroundColor = 'blue';
          cursorRef.current.style.transform = 'translate(-50%, -50%) scale(1.5)'; // Agrandar un poco
          setTimeout(() => {
             if (cursorRef.current) { // Comprobar de nuevo por si se desmontó
                cursorRef.current.style.backgroundColor = 'red';
                cursorRef.current.style.transform = 'translate(-50%, -50%) scale(1)'; // Volver a normal
             }
          }, 150); // Duración más corta para el efecto visual
        }

      } else {
        console.log("No interactive element found at click coordinates.");
      }
    }

    // --- Iniciar el proceso ---
    // Usar un pequeño retraso puede ayudar si hay problemas de inicialización
    const initTimeout = setTimeout(initializeHandTracking, 100);

    // --- Función de Limpieza del useEffect ---
    return () => {
      clearTimeout(initTimeout); // Limpiar el timeout si el componente se desmonta antes
      cleanup(); // Llamar a la función de limpieza
    };

  }, [enabled]); // Dependencia: se ejecuta cuando 'enabled' cambia

  return (
    <>
      {/* El video es necesario para MediaPipe, pero puede ser muy pequeño o estar oculto */}
      <video
        ref={videoRef}
        playsInline // Importante para móviles y autoplay
        style={{
          // display: 'none', // Opción 1: Ocultarlo completamente
          // Opción 2: Mostrarlo pequeño para depuración
          position: 'fixed', // Usar fixed para que no afecte el layout
          bottom: '10px',
          left: '10px',
          width: '160px', // Más estándar 4:3
          height: '120px',
          borderRadius: '8px',
          border: '1px solid gray',
          zIndex: 1000,
          transform: 'scaleX(-1)', // Aplicar espejo aquí si es necesario
        }}
      />

      {/* Cursor personalizado */}
      <div
        ref={cursorRef}
        style={{
          position: 'fixed', // Fixed para posicionar respecto a la ventana
          left: '0px', // Se actualizará dinámicamente
          top: '0px',  // Se actualizará dinámicamente
          width: '20px',
          height: '20px',
          backgroundColor: 'red',
          borderRadius: '50%',
          pointerEvents: 'none', // Muy importante para que no interfiera con los clics
          zIndex: 10000, // Encima de casi todo
          display: 'none', // Oculto por defecto
          transform: 'translate(-50%, -50%)', // Centrar el div en las coordenadas left/top
          transition: 'transform 0.1s ease-out, background-color 0.1s ease', // Transición suave
        }}
      />
    </>
  );
}

export default HandTracker;