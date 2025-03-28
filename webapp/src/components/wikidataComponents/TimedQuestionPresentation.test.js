import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimedQuestionPresentation from './TimedQuestionPresentation';

describe('TimedQuestionPresentation', () => {
    // Move mock objects inside describe block
    const defaultStats = {
        score: { correct: 0, incorrect: 0, rounds: 0 },
        setScore: jest.fn(),
        feedback: '',
        setFeedback: jest.fn(),
        buttonsDisabled: false,
        setButtonsDisabled: jest.fn()
    };

    const mockGame = {
        fetchQuestions: jest.fn()
    };

    const mockNavigate = jest.fn();

    const mockQuestion = {
        answers: {
            "Madrid": "madrid.jpg",
            "Paris": "paris.jpg"
        },
        correct: "Madrid"
    };

    const createMockHook = (overrides = {}) => ({
        ...defaultStats,
        ...overrides
    });

    // Mock the useStats hook
    jest.mock('../utils/QuestionUtils', () => ({
        __esModule: true,
        default: jest.fn((initialValue) => createMockHook())
    }));

    const renderComponent = () => {
        return render(
            <TimedQuestionPresentation
                game={mockGame}
                navigate={mockNavigate}
                question={mockQuestion}
            />
        );
    };

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();
        mockGame.fetchQuestions.mockClear();
        mockNavigate.mockClear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('renders timer and question presentation', () => {
        renderComponent();
        expect(screen.getByText(/⏳ Time remaining:/)).toBeInTheDocument();
        expect(screen.getByText(/⏳ Time remaining: 10s/)).toBeInTheDocument();
    });

    test('timer decrements correctly', () => {
        renderComponent();
        expect(screen.getByText(/⏳ Time remaining: 10s/)).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(screen.getByText(/⏳ Time remaining: 9s/)).toBeInTheDocument();
    });

    test('handles timeout correctly', async () => {
        renderComponent();

        act(() => {
            jest.advanceTimersByTime(10000);
        });

        expect(screen.getByText("⏳ Time's over ❌ wrong answer")).toBeInTheDocument();
    });

    test('handles correct answer', async () => {
        renderComponent();

        const correctButton = screen.getByRole('button', { name: 'Madrid' });
        fireEvent.click(correctButton);

        expect(screen.getByText('✅ Correct answer')).toBeInTheDocument();
    });

    test('handles incorrect answer', async () => {
        renderComponent();

        const correctButton = screen.getByRole('button', { name: 'Paris' });
        fireEvent.click(correctButton);

        expect(screen.getByText('❌ Wrong answer')).toBeInTheDocument();
    });

    test('fetches new question after delay', async () => {
        renderComponent();
        const button = screen.getByRole('button', { name: 'Madrid' });
        fireEvent.click(button);

        act(() => {
            jest.advanceTimersByTime(1500);
        });

        expect(mockGame.fetchQuestions).toHaveBeenCalled();
    });

    test('shows timer warning when time is low', () => {
        renderComponent();

        act(() => {
            jest.advanceTimersByTime(7000);
        });

        const timer = screen.getByText(/⏳ Time remaining: 3s/);
        expect(timer).toHaveClass('timer-low');
    });
});