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

        const isOpen = isHandOpen(landmarks);
        const now = Date.now();

        if (clickStateRef.current === 'open' && !isOpen) {
          clickStateRef.current = 'closed';
          lastClickTimeRef.current = now;
        } else if (clickStateRef.current === 'closed' && isOpen) {
          if (now - lastClickTimeRef.current < 800) {
            triggerClick(invertedX, y);
          }
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

    function isHandOpen(landmarks) {
      const isFingerExtended = (tip, dip) =>
        landmarks[tip].y < landmarks[dip].y - 0.05;

      const fingers = [
        isFingerExtended(8, 6),
        isFingerExtended(12, 10),
        isFingerExtended(16, 14),
        isFingerExtended(20, 18),
      ];

      return fingers.filter(Boolean).length >= 3;
    }

    function triggerClick(x, y) {
      const clickEvent = new MouseEvent('click', {
        clientX: x,
        clientY: y,
        bubbles: true,
        cancelable: true,
        view: window,
      });
      document.elementFromPoint(x, y)?.dispatchEvent(clickEvent);
    }
  }, [enabled]);

  return (
    <>
      <video ref={videoRef} style={{ display: 'none' }} />
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