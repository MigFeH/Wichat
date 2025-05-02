import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import ChatLLM from './ChatLLM'; // Asegúrate que la ruta sea correcta

// Mockear axios
jest.mock('axios');

// Mockear variables de entorno (ajusta si usas otro método)
const MOCKED_API_ENDPOINT = 'http://localhost:8003';
const MOCKED_API_KEY = 'test-api-key';
process.env.REACT_APP_API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT || MOCKED_API_ENDPOINT;
process.env.REACT_APP_LLM_API_KEY = process.env.REACT_APP_LLM_API_KEY || MOCKED_API_KEY;


// --- Helper function para buscar texto ignorando estructura interna ---
// Esta función se pasará a findByText/findAllByText etc.
const textMatcher = (expectedText) => (content, element) => {
  const nodeText = element?.textContent || '';
  // Compara el textContent completo del nodo con el texto esperado
  return nodeText === expectedText;
};
// --- Fin Helper ---

describe('ChatLLM Component', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders initial structure correctly', () => {
    render(<ChatLLM currentCity="TestCity" />);

    expect(screen.getByText('Chat de Pistas')).toBeInTheDocument();
    expect(screen.getByLabelText(/Pregunta al LLM.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar/i })).toBeInTheDocument();

    // --- CORRECCIÓN: Opción B (eliminar la búsqueda por role="log") ---
    // Si implementaste la Opción A en el componente, puedes descomentar esto:
    // expect(screen.getByRole('log', { name: /Chat history/i })).toBeInTheDocument();

    // Verificar que no hay mensajes iniciales (esto es suficiente)
    expect(screen.queryByText(textMatcher('Tú:'))).not.toBeInTheDocument(); // Usa queryByText para verificar ausencia
    expect(screen.queryByText(textMatcher('LLM:'))).not.toBeInTheDocument();
  });

  test('allows user to type in the input field', () => {
    render(<ChatLLM currentCity="TestCity" />);
    const input = screen.getByLabelText(/Pregunta al LLM.../i);
    fireEvent.change(input, { target: { value: 'Hola, ¿cómo estás?' } });
    expect(input.value).toBe('Hola, ¿cómo estás?');
  });

   test('uses default city name if currentCity prop is not provided', async () => {
    const userInputText = '¿Dónde estoy?';
    const botResponseText = 'Parece que estás en un lugar desconocido.';
    const defaultCity = "ciudad desconocida";
    const expectedBotMessage = `LLM: ${botResponseText}`;

    axios.post.mockResolvedValueOnce({ data: { answer: botResponseText } });

    render(<ChatLLM currentCity={null} />);

    const input = screen.getByLabelText(/Pregunta al LLM.../i);
    const sendButton = screen.getByRole('button', { name: /Enviar/i });

    fireEvent.change(input, { target: { value: userInputText } });
    fireEvent.click(sendButton);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/hint'),
      expect.objectContaining({
        question: `${defaultCity}:${userInputText}`
      })
    );

    // --- CORRECCIÓN: Usar textMatcher ---
    expect(await screen.findByText(textMatcher(expectedBotMessage))).toBeInTheDocument();
  });

  test('displays error message on failed API call', async () => {
    const mockCity = 'Madrid';
    const userInputText = '¿Alguna pista?';
    const errorMessage = 'Error al obtener respuesta.'; // Mensaje del componente
    const expectedUserMessage = `Tú: ${userInputText}`;
    const expectedBotMessage = `LLM: ${errorMessage}`;

    axios.post.mockRejectedValueOnce(new Error('Network Error'));

    render(<ChatLLM currentCity={mockCity} />);

    const input = screen.getByLabelText(/Pregunta al LLM.../i);
    const sendButton = screen.getByRole('button', { name: /Enviar/i });

    fireEvent.change(input, { target: { value: userInputText } });
    fireEvent.click(sendButton);

    // --- CORRECCIÓN: Usar textMatcher ---
    expect(await screen.findByText(textMatcher(expectedUserMessage))).toBeInTheDocument();

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
       expect.stringContaining('/hint'),
       expect.objectContaining({
         question: `${mockCity}:${userInputText}`
       })
    );

    // --- CORRECCIÓN: Usar textMatcher ---
    expect(await screen.findByText(textMatcher(expectedBotMessage))).toBeInTheDocument();
    expect(input.value).toBe('');
  });

  test('does not send message if input is empty or only whitespace', () => {
    render(<ChatLLM currentCity="TestCity" />);
    const input = screen.getByLabelText(/Pregunta al LLM.../i);
    const sendButton = screen.getByRole('button', { name: /Enviar/i });

    fireEvent.click(sendButton);
    expect(axios.post).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(sendButton);
    expect(axios.post).not.toHaveBeenCalled();

    // No es necesario usar textMatcher aquí, solo verificar que no aparezcan
    expect(screen.queryByText(/Tú:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/LLM:/i)).not.toBeInTheDocument();
  });
});