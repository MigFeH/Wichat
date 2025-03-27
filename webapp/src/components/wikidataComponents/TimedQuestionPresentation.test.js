import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import TimedQuestionPresentation from './TimedQuestionPresentation';
import { mockGame, mockNavigate, mockQuestion, setupTest, cleanupTest } from './testUtils';

describe('TimedQuestionPresentation Component', () => {
    beforeEach(() => {
        setupTest();
    });

    afterEach(() => {
        cleanupTest();
    });

    it('renders loading state when no question is provided', () => {
        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
            />
        );
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

        expect(screen.getByText('Guess the City 🌍')).toBeInTheDocument();
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
        const initialTimer = screen.getByText(/Tiempo restante: 10s/);
        expect(initialTimer).toHaveClass('timer-normal');

        // Advance timer to 3 seconds
        act(() => {
            jest.advanceTimersByTime(7000);
        });

        const timerText = screen.getByText(/Tiempo restante: 3s/);
        expect(timerText).toHaveClass('timer-low');
    });

    it('handles timeout correctly', () => {
        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        // Advance timer to completion
        act(() => {
            jest.advanceTimersByTime(10000);
        });

        expect(screen.getByText("⏳ Time's over ❌ wrong answer")).toBeInTheDocument();
    });

    it('handles correct answer selection', async () => {
        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        fireEvent.click(screen.getByText('Madrid'));
        expect(screen.getByText('✅ Correct answer')).toBeInTheDocument();

        act(() => {
            jest.advanceTimersByTime(1500);
        });

        expect(mockGame.fetchQuestions).toHaveBeenCalled();
    });

    it('handles incorrect answer selection', () => {
        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        fireEvent.click(screen.getByText('Paris'));
        expect(screen.getByText('❌ Wrong answer')).toBeInTheDocument();
    });

    it('shows final results after max rounds', () => {
        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        // Complete 10 rounds
        for (let i = 0; i < 10; i++) {
            fireEvent.click(screen.getByText('Madrid'));
            act(() => {
                jest.advanceTimersByTime(1500);
            });
        }

        expect(screen.getByText('Final results')).toBeInTheDocument();
        expect(screen.getByText(/Correct answers:/)).toBeInTheDocument();
        expect(screen.getByText(/Ratio:/)).toBeInTheDocument();
    });

    it('saves stats after game completion', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true
            })
        );

        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        // Complete 10 rounds
        for (let i = 0; i < 10; i++) {
            fireEvent.click(screen.getByText('Madrid'));
            act(() => {
                jest.advanceTimersByTime(1500);
            });
        }

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:8001/api/stats',
                expect.any(Object)
            );
        });
    });

    it('handles image load error', () => {
        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        const image = screen.getByAltText('Ciudad');
        fireEvent.error(image);
        
        expect(screen.getByAltText('Imagen no disponible')).toBeInTheDocument();
    });

    it('navigates to menu when clicking back button in results', () => {
        render(
            <TimedQuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        // Complete game
        for (let i = 0; i < 10; i++) {
            fireEvent.click(screen.getByText('Madrid'));
            act(() => {
                jest.advanceTimersByTime(1500);
            });
        }

        fireEvent.click(screen.getByText('Back to menu'));
        expect(mockNavigate).toHaveBeenCalledWith('/menu');
    });
});