import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
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
            "Madrid": "madrid.jpg",
            "Paris": "paris.jpg"
        },
        correct: "Madrid"
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    // Test básico de renderizado
    test('renders component with initial state', () => {
        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );
        expect(screen.getByText(/Time remaining: 10s/)).toBeInTheDocument();
        expect(screen.getByText('Madrid')).toBeInTheDocument();
        expect(screen.getByText('Paris')).toBeInTheDocument();
    });

    // Test del temporizador
    test('timer updates correctly', () => {
        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        // Avanzar 5 segundos
        act(() => {
            jest.advanceTimersByTime(5000);
        });
        expect(screen.getByText(/Time remaining: 5s/)).toBeInTheDocument();
    });

    // Test de respuesta correcta
    test('handles correct answer', async () => {
        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        const correctButton = screen.getByText('Madrid');
        fireEvent.click(correctButton);

        expect(screen.getByText('✅ Correct answer')).toBeInTheDocument();
        
        // Verificar que después de 1.5s se llama a fetchQuestions
        act(() => {
            jest.advanceTimersByTime(1500);
        });
        expect(mockGame.fetchQuestions).toHaveBeenCalled();
    });

    // Test de respuesta incorrecta
    test('handles incorrect answer', () => {
        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        const incorrectButton = screen.getByText('Paris');
        fireEvent.click(incorrectButton);

        expect(screen.getByText('❌ Wrong answer')).toBeInTheDocument();
    });

    // Test del timeout
    test('handles timeout correctly', () => {
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

        expect(screen.getByText("⏳ Time's over ❌ wrong answer")).toBeInTheDocument();
    });

    // Test de cambio de clase del timer cuando queda poco tiempo
    test('applies low-time warning class', () => {
        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        act(() => {
            jest.advanceTimersByTime(7000);
        });

        const timerElement = screen.getByText(/Time remaining: 3s/);
        expect(timerElement).toHaveClass('timer-low');
    });

    // Test de limpieza del intervalo
    test('cleans up interval on unmount', () => {
        const { unmount } = render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        unmount();
        
        // Verificar que no hay errores después del unmount
        act(() => {
            jest.advanceTimersByTime(1000);
        });
    });

    // Test de botones deshabilitados
    test('disables buttons after answer', () => {
        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        const button = screen.getByText('Madrid');
        fireEvent.click(button);

        expect(button).toBeDisabled();
    });
});