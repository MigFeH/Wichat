import React, { useRef, useEffect, useState } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

const CLICK_DISTANCE_THRESHOLD = 0.05;
const CLICK_COOLDOWN_MS = 500;
const MAX_HANDS = 4; // Define el número máximo de manos/usuarios
const COLORS = ['red', 'lime', 'cyan', 'yellow', 'magenta', 'orange']; // Colores para los cursores

function HandTracker({ enabled }) {
  const videoRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);
  const handStatesRef = useRef({}); // Guarda estado (gesto, timestamp) por índice de mano
  const [cursors, setCursors] = useState([]); // Estado para la data de los cursores (posición, color, etc.)

  useEffect(() => {
    const cleanup = () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
       if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
       }
       setCursors([]); // Limpiar cursores al desactivar/desmontar
       handStatesRef.current = {}; // Limpiar estados de mano
    };

    if (!enabled) {
      cleanup();
      return;
    }

    let didInitialize = false;

    const initializeHandTracking = async () => {
      if (didInitialize || !videoRef.current) return;
      didInitialize = true;

      handStatesRef.current = {}; // Resetear estados al inicializar
      setCursors([]);           // Resetear cursores al inicializar

      handsRef.current = new Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      handsRef.current.setOptions({
        maxNumHands: MAX_HANDS, // Permitir múltiples manos
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      function getDistance(p1, p2) {
          if (!p1 || !p2) return Infinity;
          return Math.sqrt(
              Math.pow(p1.x - p2.x, 2) +
              Math.pow(p1.y - p2.y, 2) +
              Math.pow((p1.z || 0) - (p2.z || 0), 2)
          );
      }

      function areFingersTouching(landmarks) {
        if (!landmarks || landmarks.length < 21) return false;
        const thumbTip = landmarks[4];
        const middleTip = landmarks[12]; // Puedes cambiar a index 8 si prefieres pulgar-índice
        const distance = getDistance(thumbTip, middleTip);
        return distance < CLICK_DISTANCE_THRESHOLD;
      }

      handsRef.current.onResults((results) => {
        const now = Date.now();
        const currentCursors = [];

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          results.multiHandLandmarks.forEach((landmarks, index) => {
            if (index >= MAX_HANDS) return; // Limitar por si acaso

            const handIndex = index; // Usar el índice de la mano como ID único
            const handColor = COLORS[handIndex % COLORS.length];

            // Inicializar estado para esta mano si no existe
            if (!handStatesRef.current[handIndex]) {
              handStatesRef.current[handIndex] = { gestureState: 'open', lastClickTimestamp: 0 };
            }
            const currentState = handStatesRef.current[handIndex];

            const indexTip = landmarks[8];

            if (indexTip) {
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                const cursorX = windowWidth - (indexTip.x * windowWidth);
                const cursorY = indexTip.y * windowHeight;

                currentCursors.push({
                    id: handIndex,
                    x: cursorX,
                    y: cursorY,
                    color: handColor,
                    visible: true,
                    scale: 1, // Estado inicial para la animación del clic
                    clickColor: 'blue' // Color durante el clic
                });

                const touching = areFingersTouching(landmarks);

                if (currentState.gestureState === 'open' && touching) {
                  if (now - currentState.lastClickTimestamp > CLICK_COOLDOWN_MS) {
                    currentState.gestureState = 'closed';
                    currentState.lastClickTimestamp = now;
                    triggerClick(cursorX, cursorY, handIndex, handColor);
                  }
                } else if (currentState.gestureState === 'closed' && !touching) {
                  currentState.gestureState = 'open';
                }
            }
          });
        }
        setCursors(currentCursors); // Actualizar el estado de todos los cursores a la vez
      });

      if (videoRef.current) {
        cameraRef.current = new Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && videoRef.current.readyState >= 3 && handsRef.current) {
               try {
                  await handsRef.current.send({ image: videoRef.current });
               } catch (error) {
                  console.error("Error sending frame to MediaPipe:", error);
               }
            }
          },
          width: 640,
          height: 480,
        });
        await cameraRef.current.start();
      }
    };

    function triggerClick(x, y, handIndex, originalColor) {
      const element = document.elementFromPoint(x, y);
      if (element) {
        const clickEvent = new MouseEvent('click', { clientX: x, clientY: y, bubbles: true, cancelable: true, view: window, detail: 1 });
        const mouseDownEvent = new MouseEvent('mousedown', { clientX: x, clientY: y, bubbles: true, cancelable: true, view: window });
        const mouseUpEvent = new MouseEvent('mouseup', { clientX: x, clientY: y, bubbles: true, cancelable: true, view: window });

        element.dispatchEvent(mouseDownEvent);
        element.dispatchEvent(mouseUpEvent);
        element.dispatchEvent(clickEvent);

        // Feedback visual cambiando estado del cursor específico
        setCursors(prevCursors => prevCursors.map(c =>
            c.id === handIndex ? { ...c, color: c.clickColor, scale: 1.5 } : c
        ));

        setTimeout(() => {
           setCursors(prevCursors => prevCursors.map(c =>
               c.id === handIndex ? { ...c, color: originalColor, scale: 1.0 } : c
           ));
        }, 150);
      }
    }

    const initTimeout = setTimeout(initializeHandTracking, 100);

    return () => {
      clearTimeout(initTimeout);
      cleanup();
    };

  }, [enabled]);

  return (
    <>
      <video
        ref={videoRef}
        playsInline
        style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          width: '160px',
          height: '120px',
          borderRadius: '8px',
          border: '1px solid gray',
          zIndex: 1000,
          transform: 'scaleX(-1)',
          // display: 'none' // Descomentar para ocultar el video
        }}
      />

      {cursors.map(cursor => (
        <div
          key={cursor.id}
          style={{
            position: 'fixed',
            left: `${cursor.x}px`,
            top: `${cursor.y}px`,
            width: '20px',
            height: '20px',
            backgroundColor: cursor.color,
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 10000,
            display: cursor.visible ? 'block' : 'none',
            transform: `translate(-50%, -50%) scale(${cursor.scale || 1})`,
            transition: 'transform 0.1s ease-out, background-color 0.1s ease',
          }}
        />
      ))}
    </>
  );
}

export default HandTracker;