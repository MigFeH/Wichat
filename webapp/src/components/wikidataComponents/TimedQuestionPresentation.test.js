import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimedQuestionPresentation from './TimedQuestionPresentation';

// Test constants and setup
const createMockHook = (feedback = '', setFeedbackMock = jest.fn()) => ({
    score: { correct: 0, incorrect: 0, rounds: 0 },
    setScore: jest.fn(),
    feedback,
    setFeedback: setFeedbackMock,
    buttonsDisabled: false,
    setButtonsDisabled: jest.fn()
});

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

// Mock the useStats hook with default implementation
jest.mock('../utils/QuestionUtils', () => ({
    __esModule: true,
    default: () => createMockHook()
}));

describe('TimedQuestionPresentation', () => {
    const renderComponent = () => {
        return render(
            <TimedQuestionPresentation
                game={mockGame}
                navigate={mockNavigate}
                question={mockQuestion}
            />
        );
    };

    const setupFeedbackTest = () => {
        let feedback = '';
        const setFeedbackMock = jest.fn((value) => {
            feedback = value;
        });

        jest.spyOn(require('../utils/QuestionUtils'), 'default')
            .mockImplementation(() => createMockHook(feedback, setFeedbackMock));

        return { feedback, setFeedbackMock };
    };

    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.clearAllMocks();
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
        const { setFeedbackMock } = setupFeedbackTest();
        renderComponent();

        act(() => {
            jest.advanceTimersByTime(10000);
        });

        await waitFor(() => {
            expect(setFeedbackMock).toHaveBeenCalledWith("⏳ Time's over ❌ wrong answer");
        });
    });

    test('handles correct answer', async () => {
        const { setFeedbackMock } = setupFeedbackTest();
        renderComponent();

        const correctButton = screen.getByRole('button', { name: 'Madrid' });
        fireEvent.click(correctButton);

        await waitFor(() => {
            expect(setFeedbackMock).toHaveBeenCalledWith('✅ Correct answer');
        });
    });

    test('handles incorrect answer', async () => {
        const { setFeedbackMock } = setupFeedbackTest();
        renderComponent();

        const incorrectButton = screen.getByRole('button', { name: 'Paris' });
        fireEvent.click(incorrectButton);

        await waitFor(() => {
            expect(setFeedbackMock).toHaveBeenCalledWith('❌ Wrong answer');
        });
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