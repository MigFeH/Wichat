import { renderHook, act } from '@testing-library/react-hooks';
import useGameLogic from './utils/GameUtils';

jest.mock('./wikidataComponents/QuestionGeneration');

describe('useGameLogic', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('initializes with default values', () => {
        const { result } = renderHook(() => useGameLogic());
        
        expect(result.current.currentQuestion).toBeNull();
        expect(result.current.currentCity).toBeNull();
        expect(result.current.questionGenerator).toBeDefined();
    });

    it('updates currentCity when currentQuestion changes', () => {
        const { result } = renderHook(() => useGameLogic());
        
        act(() => {
            result.current.questionGenerator.setCurrentQuestion({
                correct: 'Madrid'
            });
        });

        expect(result.current.currentCity).toBe('Madrid');
    });
});