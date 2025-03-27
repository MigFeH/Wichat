import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import TimedQuestionPresentation from './TimedQuestionPresentation';
import { mockGame, mockNavigate, mockQuestion, setupTest, cleanupTest } from '../utils/GameTestUtils';

describe('TimedQuestionPresentation Component', () => {
    beforeEach(() => {
        setupTest();
        jest.useFakeTimers();
    });

    afterEach(() => {
        cleanupTest();
        jest.useRealTimers();
    });

    it('renders loading state when no question is provided', () => {
        render(<TimedQuestionPresentation game={mockGame} navigate={mockNavigate} />);
        expect(screen.getByText('Loading Question...')).toBeInTheDocument();
    });

    it('renders question with timer and options', () => {
        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        expect(screen.getByText((content) => content.includes('Guess the City'))).toBeInTheDocument();
        expect(screen.getByText(/Tiempo restante: 10s/)).toBeInTheDocument();
        expect(screen.getByText('Madrid')).toBeInTheDocument();
        expect(screen.getByText('Paris')).toBeInTheDocument();
    });

    it('timer decreases and shows in red when <= 3 seconds', () => {
        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        // Timer starts at 10
        expect(screen.getByText(/Tiempo restante: 10s/)).toHaveClass('timer-normal');

        // Advance timer to 3 seconds
        act(() => {
            jest.advanceTimersByTime(7000);
        });

        expect(screen.getByText(/Tiempo restante: 3s/)).toHaveClass('timer-low');
    });

    it('handles correct answer selection', () => {
        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        fireEvent.click(screen.getByText('Madrid')); // Correct answer
        expect(screen.getByText('✅ Correct answer')).toBeInTheDocument();
    });

    it('handles incorrect answer selection', () => {
        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        fireEvent.click(screen.getByText('Paris')); // Incorrect answer
        expect(screen.getByText('❌ Wrong answer')).toBeInTheDocument();
    });

    it('handles timeout correctly', () => {
        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        // Advance timer to 0
        act(() => {
            jest.advanceTimersByTime(10000);
        });

        expect(screen.getByText("⏳ Time's over ❌ wrong answer")).toBeInTheDocument();
    });

    it('renders final results when maxRounds is reached', () => {
        const mockFinalScore = {
            correct: 5,
            incorrect: 5,
            rounds: 10
        };

        jest.spyOn(require('../utils/QuestionUtils'), 'default').mockReturnValue({
            score: mockFinalScore,
            setScore: jest.fn(),
            feedback: null,
            setFeedback: jest.fn(),
            buttonsDisabled: false,
            setButtonsDisabled: jest.fn()
        });

        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        expect(screen.getByText('Final results')).toBeInTheDocument();
        expect(screen.getByText('Correct answers: 5')).toBeInTheDocument();
        expect(screen.getByText('Incorrect answers: 5')).toBeInTheDocument();
        expect(screen.getByText('Ratio: 50%')).toBeInTheDocument();
    });
});