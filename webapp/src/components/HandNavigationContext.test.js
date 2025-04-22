import React from 'react';
import { render, act } from '@testing-library/react';
import { HandNavigationProvider, useHandNavigation } from './HandNavigationContext';

function TestComponent() {
  const { isHandNavigationEnabled, toggleHandNavigation } = useHandNavigation();
  return (
    <div>
      <span data-testid="enabled">{isHandNavigationEnabled ? 'on' : 'off'}</span>
      <button onClick={() => toggleHandNavigation(true)}>Enable</button>
      <button onClick={() => toggleHandNavigation(false)}>Disable</button>
    </div>
  );
}

describe('HandNavigationContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('proporciona el valor inicial correctamente', () => {
    const { getByTestId } = render(
      <HandNavigationProvider>
        <TestComponent />
      </HandNavigationProvider>
    );
    expect(getByTestId('enabled').textContent).toBe('off');
  });

  it('cambia el estado y localStorage al habilitar/deshabilitar', () => {
    const { getByText, getByTestId } = render(
      <HandNavigationProvider>
        <TestComponent />
      </HandNavigationProvider>
    );
    act(() => {
      getByText('Enable').click();
    });
    expect(getByTestId('enabled').textContent).toBe('on');
    expect(localStorage.getItem('handNavigationEnabled')).toBe('true');

    act(() => {
      getByText('Disable').click();
    });
    expect(getByTestId('enabled').textContent).toBe('off');
    expect(localStorage.getItem('handNavigationEnabled')).toBe('false');
  });

  it('recupera el valor inicial desde localStorage', () => {
    localStorage.setItem('handNavigationEnabled', 'true');
    const { getByTestId } = render(
      <HandNavigationProvider>
        <TestComponent />
      </HandNavigationProvider>
    );
    expect(getByTestId('enabled').textContent).toBe('on');
  });

  it('lanza error si useHandNavigation se usa fuera del provider', () => {
    // Silence error output for this test
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestComponent />)).toThrow(
      'useHandNavigation must be used within a HandNavigationProvider'
    );
    spy.mockRestore();
  });
});