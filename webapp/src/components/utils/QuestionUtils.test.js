import React from 'react';
import { render, act } from '@testing-library/react';
import useStats from './QuestionUtils';

const TestComponent = ({ maxRounds, onHookReady }) => {
    const hook = useStats(maxRounds);

    // Llama a la función `onHookReady` para exponer el hook a las pruebas
    React.useEffect(() => {
        if (onHookReady) {
            onHookReady(hook);
        }
    }, [hook, onHookReady]);

    return <div>Test Component</div>;
};

describe('useStats', () => {
    beforeEach(() => {
        localStorage.setItem('username', 'testUser');
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({}),
            })
        );
    });

    afterEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    it('initializes with default values', () => {
        let hook;
        render(
            <TestComponent
                maxRounds={10}
                onHookReady={(h) => {
                    hook = h;
                }}
            />
        );

        expect(hook.score).toEqual({ correct: 0, incorrect: 0, rounds: 0 });
        expect(hook.feedback).toBeNull();
        expect(hook.buttonsDisabled).toBe(false);
    });

    it('updates score correctly', () => {
        let hook;
        render(
            <TestComponent
                maxRounds={10}
                onHookReady={(h) => {
                    hook = h;
                }}
            />
        );

        act(() => {
            hook.setScore({ correct: 1, incorrect: 0, rounds: 1 });
        });

        expect(hook.score).toEqual({ correct: 1, incorrect: 0, rounds: 1 });
    });

    it('saves stats when maxRounds is reached', async () => {
        global.fetch.mockImplementationOnce(() =>
            Promise.resolve({ ok: true })
        );

        let hook;
        render(
            <TestComponent
                maxRounds={2}
                onHookReady={(h) => {
                    hook = h;
                }}
            />
        );

        act(() => {
            hook.setScore({ correct: 1, incorrect: 1, rounds: 2 });
        });

        expect(global.fetch).toHaveBeenCalledWith('http://localhost:8001/api/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'testUser',
                score: 1,
                correctAnswers: 1,
                incorrectAnswers: 1,
                totalRounds: 2
            })
        });
    });

    it('does not save stats if maxRounds is not reached', () => {
        let hook;
        render(
            <TestComponent
                maxRounds={3}
                onHookReady={(h) => {
                    hook = h;
                }}
            />
        );

        act(() => {
            hook.setScore({ correct: 1, incorrect: 1, rounds: 2 });
        });

        expect(global.fetch).not.toHaveBeenCalled();
    });
});