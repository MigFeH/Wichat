import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import ProtectedRoute from './auth/ProtectedRoute';

jest.mock('./auth/ProtectedRoute', () => ({
  __esModule: true,
  default: ({ element }) => element,
}));

describe('App', () => {
  test('should render Home, Register, Login, and Protected Routes correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/home']}>
        <Routes>
          <Route path="/" element={<App />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/home/i)).toBeInTheDocument();
    expect(screen.getByText(/register/i)).toBeInTheDocument();
    expect(screen.getByText(/login/i)).toBeInTheDocument();
    
    render(
      <MemoryRouter initialEntries={['/menu']}>
        <Routes>
          <Route path="/" element={<App />} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.getByText(/menu/i)).toBeInTheDocument();
  });
});
