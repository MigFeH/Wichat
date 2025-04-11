import React, { useRef, useEffect } from 'react';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

function HandTracker({ enabled }) {
  const videoRef = useRef(null);
  const cursorRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);

  const clickStateRef = useRef('open');
  const lastClickTimeRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      // Desactivar: detener cámara y ocultar cursor
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (cursorRef.current) {
        cursorRef.current.style.display = 'none';
      }
      return;
    }

    handsRef.current = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    handsRef.current.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    function areFingersTouching(landmarks) {
      const thumbTip = landmarks[4]; // Punta del pulgar
      const middleTip = landmarks[12]; // Punta del dedo corazón

      // Calcular la distancia euclidiana entre los dos puntos
      const distance = Math.sqrt(
        Math.pow(thumbTip.x - middleTip.x, 2) +
        Math.pow(thumbTip.y - middleTip.y, 2)
      );

      return distance < 0.05; // Considerar que están tocándose si la distancia es menor a 0.05
    }

    handsRef.current.onResults((results) => {
      if (cursorRef.current) {
        cursorRef.current.style.display = 'block';
      }

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        const indexTip = landmarks[8]; // Punta del dedo índice

        // Obtener el ancho de la ventana
        const windowWidth = window.innerWidth;
        
        // Invertir la coordenada X
        const invertedX = windowWidth - (indexTip.x * windowWidth);
        const y = indexTip.y * window.innerHeight;

        if (cursorRef.current) {
          cursorRef.current.style.transform = `translate(${invertedX}px, ${y}px)`;
        }

        const areTouching = areFingersTouching(landmarks);
        const now = Date.now();

        if (clickStateRef.current === 'open' && areTouching) {
          clickStateRef.current = 'closed';
          lastClickTimeRef.current = now;
          triggerClick(invertedX, y);
        } else if (clickStateRef.current === 'closed' && !areTouching) {
          clickStateRef.current = 'open';
        }
      }
    });

    cameraRef.current = new Camera(videoRef.current, {
      onFrame: async () => {
        await handsRef.current.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    cameraRef.current.start();

    function triggerClick(x, y) {
      const clickEvent = new MouseEvent('click', {
        clientX: x,
        clientY: y,
        bubbles: true,
        cancelable: true,
        view: window,
        detail: 2
      });

      // Cambiar el color del cursor al hacer clic
      if (cursorRef.current) {
        cursorRef.current.style.backgroundColor = 'blue'; // Cambiar a azul
        setTimeout(() => {
          cursorRef.current.style.backgroundColor = 'red'; // Volver al color original
        }, 200); // Duración del cambio de color (200ms)
      }

      document.elementFromPoint(x, y)?.dispatchEvent(clickEvent);
    }
  }, [enabled]);

  return (
    <>
      <video
        ref={videoRef}
        style={{
          position: 'absolute',
          width: '150px', // Ancho del video
          height: '100px', // Alto del video
          borderRadius: '10px', // Bordes redondeados
          zIndex: 1000, // Asegurar que esté encima de otros elementos
        }}
      />

      <div
        ref={cursorRef}
        style={{
          position: 'fixed',
          width: '20px',
          height: '20px',
          backgroundColor: 'red',
          borderRadius: '50%',
          pointerEvents: 'none',
          transform: 'translate(-50%, -50%)',
          zIndex: 10000,
          display: 'none',
        }}
      />
    </>
  );
}

export default HandTracker;