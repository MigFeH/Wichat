import QuestionGeneration from '../components/wikidataComponents/QuestionGeneration';
import {render, screen} from "@testing-library/react";
import QuestionPresentation from "../components/wikidataComponents/QuestionPresentation";

jest.mock('../components/wikidataComponents/QuestionGeneration');

describe('QuestionGeneration', () => {
  let mockSetQuestion;
  let questionGenerator;

  beforeEach(() => {
    mockSetQuestion = jest.fn();
    questionGenerator = new QuestionGeneration(mockSetQuestion);
  });

  test('should initialize with empty cache and index 0', () => {
    expect(questionGenerator.questionsCache).toEqual([]);
    expect(questionGenerator.currentIndex).toBe(0);
  });

  test('should load the page', async () => {

    render(<QuestionPresentation />);
    const welcomeMessage = screen.getByText(/Adivina la ciudad/i);
    expect(welcomeMessage).toBeInTheDocument();

  });

  test('should return the next question from cache', async () => {
    questionGenerator.questionsCache = [{ question: 'Pregunta de prueba' }];
    const question = questionGenerator.getNextQuestion();

    expect(question).toEqual({ question: 'Pregunta de prueba' });
    expect(questionGenerator.questionsCache.length).toBe(0);
  });
});


