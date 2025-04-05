import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimedQuestionPresentation from './TimedQuestionPresentation';

jest.useFakeTimers();

describe('TimedQuestionPresentation', () => {
    const mockGame = {
        fetchQuestions: jest.fn()
    };
    const mockNavigate = jest.fn();
    const mockQuestion = {
        question: "Test question",
        answers: {
            a: "Answer 1",
            b: "Answer 2"
        },
        correct: "a"
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('timer starts at 10 seconds', () => {
        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );
        expect(screen.getByText(/Time remaining: 10s/)).toBeInTheDocument();
    });

    test('timer counts down correctly', () => {
        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(screen.getByText(/Time remaining: 9s/)).toBeInTheDocument();
    });

    test('shows timeout message when timer reaches 0', () => {
        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        act(() => {
            jest.advanceTimersByTime(10000);
        });

        expect(screen.getByText(/Time's over ❌ wrong answer/)).toBeInTheDocument();
    });
});