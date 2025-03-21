import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import Home from './Home';

// filepath: c:\Local\ASW\wichat_es2b\wichat_es2b\webapp\src\components\Home.test.js

describe('Home Component', () => {
  test('should display Login component by default', () => {
    render(<Home />);
    expect(screen.getByText("Don't have an account? Register here.")).toBeInTheDocument();
  });

  test('should switch to Register component when link is clicked', () => {
    render(<Home />);
    fireEvent.click(screen.getByText("Don't have an account? Register here."));
    expect(screen.getByText("Already have an account? Login here.")).toBeInTheDocument();
  });

  test('should switch back to Login component when link is clicked again', () => {
    render(<Home />);
    fireEvent.click(screen.getByText("Don't have an account? Register here."));
    fireEvent.click(screen.getByText("Already have an account? Login here."));
    expect(screen.getByText("Don't have an account? Register here.")).toBeInTheDocument();
  });
});