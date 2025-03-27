import { renderHook, act } from '@testing-library/react-hooks';
import useStats from './QuestionUtils';

describe('useStats', () => {
    beforeEach(() => {
        localStorage.setItem('username', 'testUser');
        global.fetch = jest.fn();
    });

    afterEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    });

    it('initializes with default values', () => {
        const { result } = renderHook(() => useStats());

        expect(result.current.score).toEqual({ correct: 0, incorrect: 0, rounds: 0 });
        expect(result.current.feedback).toBeNull();
        expect(result.current.buttonsDisabled).toBe(false);
    });

    it('updates score correctly', () => {
        const { result } = renderHook(() => useStats());

        act(() => {
            result.current.setScore({ correct: 1, incorrect: 0, rounds: 1 });
        });

        expect(result.current.score).toEqual({ correct: 1, incorrect: 0, rounds: 1 });
    });

    it('saves stats when maxRounds is reached', async () => {
        global.fetch.mockImplementationOnce(() =>
            Promise.resolve({ ok: true })
        );

        const { result } = renderHook(() => useStats(2));

        act(() => {
            result.current.setScore({ correct: 1, incorrect: 1, rounds: 2 });
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
        const { result } = renderHook(() => useStats(3));

        act(() => {
            result.current.setScore({ correct: 1, incorrect: 1, rounds: 2 });
        });

        expect(global.fetch).not.toHaveBeenCalled();
    });
});