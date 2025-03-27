import { renderHook, act } from '@testing-library/react-hooks';
import useGameLogic from './GameUtils';
import QuestionGeneration from '../wikidataComponents/QuestionGeneration';

jest.mock('../wikidataComponents/QuestionGeneration');

describe('useGameLogic', () => {
    let mockSetCurrentQuestion;

    beforeEach(() => {
        mockSetCurrentQuestion = jest.fn();
        QuestionGeneration.mockImplementation(() => ({
            fetchQuestions: jest.fn(),
            setCurrentQuestion: mockSetCurrentQuestion,
        }));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('initializes with default values', () => {
        const { result } = renderHook(() => useGameLogic());

        expect(result.current.currentQuestion).toBeNull();
        expect(result.current.currentCity).toBeNull();
        expect(result.current.questionGenerator).toBeDefined();
    });

    it('calls fetchQuestions on mount', () => {
        renderHook(() => useGameLogic());

        expect(QuestionGeneration).toHaveBeenCalledTimes(1);
        expect(QuestionGeneration.mock.instances[0].fetchQuestions).toHaveBeenCalled();
    });

    it('updates currentCity when currentQuestion changes', () => {
        const { result } = renderHook(() => useGameLogic());

        act(() => {
            result.current.questionGenerator.setCurrentQuestion({
                correct: 'Paris',
            });
        });

        expect(result.current.currentCity).toBe('Paris');
    });
});