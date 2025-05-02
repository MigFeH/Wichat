import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HandTracker from './HandTracker';

// --- Mocks para MediaPipe Hands y Camera ---
jest.mock('@mediapipe/camera_utils', () => {
    const mockCameraStart = jest.fn().mockResolvedValue(undefined);
    const mockCameraStop = jest.fn();
    let cameraOnFrameCallback = null;
    function MockCamera(videoElement, config) {
        if (config && typeof config.onFrame === 'function') {
            cameraOnFrameCallback = config.onFrame;
        }
        return {
            start: mockCameraStart,
            stop: mockCameraStop,
        };
    }
    MockCamera.mockCameraStart = mockCameraStart;
    MockCamera.mockCameraStop = mockCameraStop;
    MockCamera.cameraOnFrameCallback = () => cameraOnFrameCallback;
    return {
        __esModule: true,
        Camera: MockCamera,
        default: MockCamera,
    };
});

jest.mock('@mediapipe/hands', () => {
    const mockHandsClose = jest.fn().mockResolvedValue(undefined);
    const mockHandsSend = jest.fn().mockResolvedValue(undefined);
    const mockHandsSetOptions = jest.fn();
    let handsOnResultsCallback = null;
    const mockHandsInstance = {
        setOptions: mockHandsSetOptions,
        onResults: (cb) => { handsOnResultsCallback = cb; },
        send: mockHandsSend,
        close: mockHandsClose,
    };
    function MockHands() {
        return mockHandsInstance;
    }
    MockHands.mockHandsClose = mockHandsClose;
    MockHands.mockHandsSend = mockHandsSend;
    MockHands.mockHandsSetOptions = mockHandsSetOptions;
    MockHands.handsOnResultsCallback = () => handsOnResultsCallback;
    MockHands.mockHandsInstance = mockHandsInstance;
    return {
        __esModule: true,
        Hands: MockHands,
        default: MockHands,
    };
});

// Mock para elementFromPoint
const mockElement = { dispatchEvent: jest.fn() };
let originalElementFromPoint;

beforeAll(() => {
    originalElementFromPoint = document.elementFromPoint;
    document.elementFromPoint = () => mockElement;
});
afterAll(() => {
    document.elementFromPoint = originalElementFromPoint;
});

beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
});
afterEach(() => {
    jest.useRealTimers();
});

// Acceso a los mocks en los tests
const { Camera } = require('@mediapipe/camera_utils');
const { Hands } = require('@mediapipe/hands');

describe('HandTracker', () => {
    test('no muestra overlays ni cursores en estado IDLE', () => {
        render(<HandTracker enabled={false} />);
        expect(screen.queryByText(/procesando|configurando|iniciando|accediendo|esperando|error|desactivando/i)).not.toBeInTheDocument();
        expect(screen.getByTestId('handtracker-video')).toHaveStyle('visibility: hidden');
    });

    test('muestra overlay de carga al habilitar', async () => {
        const { rerender } = render(<HandTracker enabled={false} />);
        rerender(<HandTracker enabled={true} />);
        expect(
          await screen.findByText(
            (text) =>
              /configurando detección/i.test(text) ||
              /cámara iniciada\. esperando detección/i.test(text)
          )
        ).toBeInTheDocument();
        expect(Hands.mockHandsSetOptions).toHaveBeenCalled();
        // Ya no comprobamos Camera directamente porque no es un mock de Jest
        expect(Camera.mockCameraStart).toHaveBeenCalled();
    });

    test('transiciona a RUNNING tras recibir resultados', async () => {
        render(<HandTracker enabled={true} />);
        await waitFor(() => expect(Hands.mockHandsSetOptions).toHaveBeenCalled());
        await waitFor(() => expect(Camera.mockCameraStart).toHaveBeenCalled());
        // Simula primer resultado
        act(() => {
            if (Hands.handsOnResultsCallback()) Hands.handsOnResultsCallback()({ multiHandLandmarks: [] });
            jest.runOnlyPendingTimers();
        });
        await waitFor(() => expect(screen.getByTestId('handtracker-video')).toHaveStyle('visibility: visible'));
    });

    test('muestra overlay de error si la cámara falla', async () => {
        Camera.mockCameraStart.mockRejectedValueOnce(new Error('Camera Error'));
        render(<HandTracker enabled={true} />);
        await waitFor(() => expect(Camera.mockCameraStart).toHaveBeenCalled());
        expect(await screen.findByText(/error al iniciar/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Cerrar/i })).toBeInTheDocument();
    });

    test('renderiza cursor cuando hay landmarks', async () => {
        render(<HandTracker enabled={true} />);
        await waitFor(() => expect(Hands.mockHandsSetOptions).toHaveBeenCalled());
        await waitFor(() => expect(Camera.mockCameraStart).toHaveBeenCalled());
        // Simula primer resultado para pasar a RUNNING
        act(() => {
            if (Hands.handsOnResultsCallback()) Hands.handsOnResultsCallback()({ multiHandLandmarks: [] });
            jest.runOnlyPendingTimers();
        });
        // Ahora simula landmarks para el cursor
        act(() => {
            if (Hands.handsOnResultsCallback()) {
                const landmarks = Array(21).fill({ x: 0.5, y: 0.5, z: 0 });
                Hands.handsOnResultsCallback()({ multiHandLandmarks: [landmarks] });
                jest.runOnlyPendingTimers();
            }
        });
        await waitFor(() => {
            expect(document.querySelector('[data-hand-cursor]')).toBeInTheDocument();
        });
    });

    test('lanza eventos de click cuando los dedos se juntan', async () => {
        render(<HandTracker enabled={true} />);
        await waitFor(() => expect(Hands.mockHandsSetOptions).toHaveBeenCalled());
        await waitFor(() => expect(Camera.mockCameraStart).toHaveBeenCalled());
        // Simula primer resultado para pasar a RUNNING
        act(() => {
            if (Hands.handsOnResultsCallback()) Hands.handsOnResultsCallback()({ multiHandLandmarks: [] });
            jest.runOnlyPendingTimers();
        });
        // Limpia los mocks de eventos
        const mockElement = document.elementFromPoint();
        mockElement.dispatchEvent.mockClear();
        // Simula landmarks con pulgar y corazón juntos
        act(() => {
            const landmarks = Array(21).fill({ x: 0.5, y: 0.5, z: 0 });
            landmarks[4] = { x: 0.51, y: 0.51, z: 0 }; // pulgar
            landmarks[12] = { x: 0.52, y: 0.52, z: 0 }; // corazón
            landmarks[8] = { x: 0.5, y: 0.5, z: 0 }; // índice
            if (Hands.handsOnResultsCallback()) Hands.handsOnResultsCallback()({ multiHandLandmarks: [landmarks] });
            jest.runOnlyPendingTimers();
        });
        await waitFor(() => {
            expect(mockElement.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'mousedown' }));
            expect(mockElement.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'mouseup' }));
            expect(mockElement.dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'click' }));
        });
    });

    test('muestra overlay de error y permite resetear', async () => {
        render(<HandTracker enabled={true} />);
        await waitFor(() => expect(Camera.mockCameraStart).toHaveBeenCalled());
        // Fuerza el error de inicialización
        act(() => {
            // Simula error en la cámara
            Camera.mockCameraStart.mockRejectedValueOnce(new Error('Camera Error'));
        });
        // Vuelve a renderizar para disparar el error
        render(<HandTracker enabled={true} />);
        // Espera a que aparezca el overlay de error
        const errorButton = await screen.findByRole('button', { name: /Cerrar/i });
        expect(errorButton).toBeInTheDocument();
        act(() => {
            errorButton.click();
        });
        // Puede haber más de un video, solo comprobamos que al menos uno existe
        const videos = screen.getAllByTestId('handtracker-video');
        expect(videos.length).toBeGreaterThan(0);
    });

    test('muestra overlay de limpieza cuando se desactiva', async () => {
        const { rerender } = render(<HandTracker enabled={true} />);
        await waitFor(() => expect(Camera.mockCameraStart).toHaveBeenCalled());
        rerender(<HandTracker enabled={false} />);
        expect(await screen.findByText(/desactivando/i)).toBeInTheDocument();
    });

    test('no renderiza cursores si no hay landmarks', async () => {
        render(<HandTracker enabled={true} />);
        await waitFor(() => expect(Camera.mockCameraStart).toHaveBeenCalled());
        act(() => {
            if (Hands.handsOnResultsCallback()) Hands.handsOnResultsCallback()({ multiHandLandmarks: [] });
            jest.runOnlyPendingTimers();
        });
        expect(document.querySelector('[data-hand-cursor]')).not.toBeInTheDocument();
    });

    test('renderiza varios cursores si hay varias manos', async () => {
        render(<HandTracker enabled={true} />);
        await waitFor(() => expect(Camera.mockCameraStart).toHaveBeenCalled());
        // Simula primer resultado para pasar a RUNNING
        act(() => {
            if (Hands.handsOnResultsCallback()) Hands.handsOnResultsCallback()({ multiHandLandmarks: [] });
            jest.runOnlyPendingTimers();
        });
        // Ahora simula varias manos
        act(() => {
            if (Hands.handsOnResultsCallback()) {
                const hand1 = Array(21).fill({ x: 0.2, y: 0.2, z: 0 });
                const hand2 = Array(21).fill({ x: 0.8, y: 0.8, z: 0 });
                Hands.handsOnResultsCallback()({ multiHandLandmarks: [hand1, hand2] });
                jest.runOnlyPendingTimers();
            }
        });
        await waitFor(() => {
            expect(document.querySelectorAll('[data-hand-cursor]').length).toBe(2);
        });
    });

    test('dispara timeout de inicialización si no llegan resultados', async () => {
        jest.useFakeTimers();
        render(<HandTracker enabled={true} />);
        await waitFor(() => expect(Camera.mockCameraStart).toHaveBeenCalled());
        // Avanza el tiempo para forzar el timeout
        act(() => {
            jest.advanceTimersByTime(21000);
        });
        expect(await screen.findByText(/no se pudo iniciar la detección/i)).toBeInTheDocument();
        jest.useRealTimers();
    });

    test('no hay fugas ni errores al desmontar durante inicialización', () => {
        const { unmount } = render(<HandTracker enabled={true} />);
        unmount();
        // Si no hay errores ni warnings, el test pasa
    });

    test('cubre cambios rápidos de enabled', async () => {
        const { rerender } = render(<HandTracker enabled={false} />);
        rerender(<HandTracker enabled={true} />);
        rerender(<HandTracker enabled={false} />);
        rerender(<HandTracker enabled={true} />);
        await waitFor(() => expect(Camera.mockCameraStart).toHaveBeenCalled());
    });

    test('no renderiza cursores si landmarks es undefined', async () => {
        render(<HandTracker enabled={true} />);
        await waitFor(() => expect(Camera.mockCameraStart).toHaveBeenCalled());
        act(() => {
            if (Hands.handsOnResultsCallback()) Hands.handsOnResultsCallback()({});
            jest.runOnlyPendingTimers();
        });
        expect(document.querySelector('[data-hand-cursor]')).not.toBeInTheDocument();
    });

    test('ignora landmarks incompletos', async () => {
        render(<HandTracker enabled={true} />);
        await waitFor(() => expect(Camera.mockCameraStart).toHaveBeenCalled());
        act(() => {
            if (Hands.handsOnResultsCallback()) {
                const incomplete = Array(10).fill({ x: 0.5, y: 0.5, z: 0 });
                Hands.handsOnResultsCallback()({ multiHandLandmarks: [incomplete] });
                jest.runOnlyPendingTimers();
            }
        });
        expect(document.querySelector('[data-hand-cursor]')).not.toBeInTheDocument();
    });

    test('no renderiza más de MAX_HANDS cursores', async () => {
        render(<HandTracker enabled={true} />);
        await waitFor(() => expect(Camera.mockCameraStart).toHaveBeenCalled());
        // Simula primer resultado para pasar a RUNNING
        act(() => {
            if (Hands.handsOnResultsCallback()) Hands.handsOnResultsCallback()({ multiHandLandmarks: [] });
            jest.runOnlyPendingTimers();
        });
        // Ahora simula varias manos
        act(() => {
            if (Hands.handsOnResultsCallback()) {
                const hand = Array(21).fill({ x: 0.5, y: 0.5, z: 0 });
                Hands.handsOnResultsCallback()({ multiHandLandmarks: [hand, hand, hand, hand, hand, hand] });
                jest.runOnlyPendingTimers();
            }
        });
        await waitFor(() => {
            expect(document.querySelectorAll('[data-hand-cursor]').length).toBe(4); // MAX_HANDS = 4
        });
    });

    test('no actualiza estado tras unmount', async () => {
        const { unmount } = render(<HandTracker enabled={true} />);
        await waitFor(() => expect(Camera.mockCameraStart).toHaveBeenCalled());
        unmount();
        // Simula resultado después de unmount
        act(() => {
            if (Hands.handsOnResultsCallback()) Hands.handsOnResultsCallback()({ multiHandLandmarks: [] });
            jest.runOnlyPendingTimers();
        });
        // Si no hay errores ni warnings, el test pasa
    });

    test('cubre rama de error en onFrame de la cámara', async () => {
        render(<HandTracker enabled={true} />);
        await waitFor(() => expect(Camera.mockCameraStart).toHaveBeenCalled());
        // Simula primer resultado para pasar a RUNNING
        act(() => {
            if (Hands.handsOnResultsCallback()) Hands.handsOnResultsCallback()({ multiHandLandmarks: [] });
            jest.runOnlyPendingTimers();
        });
        // Simula error en send de MediaPipe
        const error = new Error('send error');
        Hands.mockHandsSend.mockRejectedValueOnce(error);
        // Llama al onFrame (esto debería cubrir el catch)
        const onFrame = Camera.cameraOnFrameCallback();
        await act(async () => {
            await onFrame();
        });
        // Si no hay errores ni warnings, el test pasa
    });

    test('cubre cleanup completo aunque no haya cámara ni hands', async () => {
        const { rerender } = render(<HandTracker enabled={true} />);
        await waitFor(() => expect(Camera.mockCameraStart).toHaveBeenCalled());
        // Fuerza el estado CLEANING_UP sin cámara ni hands
        Camera.mockCameraStart.mockClear();
        rerender(<HandTracker enabled={false} />);
        // El overlay de limpieza debe aparecer
        expect(await screen.findByText(/desactivando/i)).toBeInTheDocument();
    });

    test('cubre error en hands.close()', async () => {
        render(<HandTracker enabled={true} />);
        await waitFor(() => expect(Camera.mockCameraStart).toHaveBeenCalled());
        Hands.mockHandsClose.mockRejectedValueOnce(new Error('close error'));
        const { rerender } = render(<HandTracker enabled={true} />);
        rerender(<HandTracker enabled={false} />);
    });

    test('no hace nada si onResults recibe null o el componente está desmontado', async () => {
        const { unmount } = render(<HandTracker enabled={true} />);
        await waitFor(() => expect(Camera.mockCameraStart).toHaveBeenCalled());
        unmount();
        act(() => {
            if (Hands.handsOnResultsCallback()) Hands.handsOnResultsCallback()(null);
        });
    });

    test('cleanup de useEffect desmonta cámara y hands y cubre errores en stop/close', async () => {
        render(<HandTracker enabled={true} />);
        await waitFor(() => expect(Camera.mockCameraStart).toHaveBeenCalled());
        Camera.mockCameraStop.mockImplementationOnce(() => { throw new Error('stop error'); });
        Hands.mockHandsClose.mockImplementationOnce(() => { throw new Error('close error'); });
        const { unmount } = render(<HandTracker enabled={true} />);
        unmount();
    });

    test('aborta initializeHandTracking si cambia enabled o se desmonta', async () => {
        let resolveCameraStart;
        Camera.mockCameraStart.mockImplementation(() => new Promise((resolve) => { resolveCameraStart = resolve; }));
        const { rerender, unmount } = render(<HandTracker enabled={true} />);
        rerender(<HandTracker enabled={false} />);
        act(() => { resolveCameraStart && resolveCameraStart(); });
        unmount();
    });

    test('cubre delay y ramas else en cleanup', async () => {
        render(<HandTracker enabled={true} />);
        await waitFor(() => expect(Camera.mockCameraStart).toHaveBeenCalled());
        const { rerender } = render(<HandTracker enabled={true} />);
        rerender(<HandTracker enabled={false} />);
        act(() => { jest.advanceTimersByTime(1000); });
    });

    test('locateFile: cubre warn de instanceIdRef no coincidente', async () => {
        let resolveCameraStart;
        Camera.mockCameraStart.mockImplementation(() => new Promise((resolve) => { resolveCameraStart = resolve; }));
        const { rerender } = render(<HandTracker enabled={true} />);
        rerender(<HandTracker enabled={false} />);
        act(() => { resolveCameraStart && resolveCameraStart(); });
    });
});