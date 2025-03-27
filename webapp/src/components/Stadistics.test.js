import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Stadistics from './Stadistics';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

const mockedUsedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedUsedNavigate,
}));
jest.mock('axios');

describe('Stadistics Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUsedNavigate.mockReset();
    localStorage.setItem('username', 'testUser');
  });
});