import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

test('renders welcome message', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  const welcomeMessage = screen.getByText(/Welcome to the 2025 edition of the Software Architecture course/i);
  expect(welcomeMessage).toBeInTheDocument();
});

test('renders Home component', () => {
  render(
    <MemoryRouter initialEntries={['/home']}>
      <App />
    </MemoryRouter>
  );
  const homeElement = screen.getByText(/Home/i);
  expect(homeElement).toBeInTheDocument();
});

test('renders Login component', () => {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>
  );
  const loginElement = screen.getByText(/Login/i);
  expect(loginElement).toBeInTheDocument();
});

test('renders Register component', () => {
  render(
    <MemoryRouter initialEntries={['/register']}>
      <App />
    </MemoryRouter>
  );
  const registerElement = screen.getByText(/Register/i);
  expect(registerElement).toBeInTheDocument();
});

test('renders Menu component for authenticated user', () => {
  render(
    <MemoryRouter initialEntries={['/menu']}>
      <App />
    </MemoryRouter>
  );
  const menuElement = screen.getByText(/Menu/i);
  expect(menuElement).toBeInTheDocument();
});

test('renders Game component for authenticated user', () => {
  render(
    <MemoryRouter initialEntries={['/game']}>
      <App />
    </MemoryRouter>
  );
  const gameElement = screen.getByText(/Game/i);
  expect(gameElement).toBeInTheDocument();
});

test('renders Stadistics component for authenticated user', () => {
  render(
    <MemoryRouter initialEntries={['/stadistics']}>
      <App />
    </MemoryRouter>
  );
  const stadisticsElement = screen.getByText(/Stadistics/i);
  expect(stadisticsElement).toBeInTheDocument();
});