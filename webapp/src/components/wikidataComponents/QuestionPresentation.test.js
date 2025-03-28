import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import QuestionPresentation from './QuestionPresentation';
import { mockGame, mockNavigate, mockQuestion, setupTest, cleanupTest } from '../utils/GameTestUtils';

describe('QuestionPresentation Component', () => {
    beforeEach(() => {
        setupTest();
    });

    afterEach(() => {
        cleanupTest();
    });

    it('renders loading state when no question is provided', () => {
        render(<QuestionPresentation game={mockGame} navigate={mockNavigate} />);
        expect(screen.getByText('Loading Question...')).toBeInTheDocument();
    });

    it('renders question with options when question is provided', () => {
        render(
            <QuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        expect(screen.getByText((content) => content.includes('Guess the City'))).toBeInTheDocument();
        expect(screen.getByText('Madrid')).toBeInTheDocument();
        expect(screen.getByText('Paris')).toBeInTheDocument();
    });

    it('handles correct answer selection', async () => {
        render(
            <QuestionPresentation 
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
            <QuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        fireEvent.click(screen.getByText('Paris'));
        expect(screen.getByText('❌ Wrong answer')).toBeInTheDocument();
    });

    it('shows final results after max rounds', async () => {
        render(
            <QuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        // Simulate 10 rounds
        for (let i = 0; i < 10; i++) {
            fireEvent.click(screen.getByText('Madrid'));
            act(() => {
                jest.advanceTimersByTime(1500);
            });
        }

        expect(screen.getByText('Final results')).toBeInTheDocument();
        expect(screen.getByText('Back to menu')).toBeInTheDocument();
    });

    it('handles image load error', () => {
        render(
            <QuestionPresentation 
                game={mockGame} 
                navigate={mockNavigate} 
                question={mockQuestion}
            />
        );

        const image = screen.getByAltText('Ciudad');
        fireEvent.error(image);
        
        expect(screen.getByAltText('Imagen no disponible')).toBeInTheDocument();
    });

    it('saves stats after game completion', async () => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true
            })
        );

        render(
            <QuestionPresentation 
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

    it('handles stats saving error', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        global.fetch = jest.fn(() =>
            Promise.reject(new Error('Failed to save stats'))
        );

        render(
            <QuestionPresentation 
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
            expect(consoleSpy).toHaveBeenCalled();
        });

        consoleSpy.mockRestore();
    });
});