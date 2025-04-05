import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Profile from './Profile';
import '@testing-library/jest-dom';


jest.mock('axios');


const localStorageMock = (() => {
  let store = {};
  return {
    getItem(key) { return store[key] || null; },
    setItem(key, value) { store[key] = value.toString(); },
    clear() { store = {}; },
    removeItem(key) { delete store[key]; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });


const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));


const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8001';
const TOTAL_IMAGES = 8;


describe('Profile Component', () => {
  const testUser = 'testuser';
  const initialProfileImage = 'profile_2.gif';
  const initialImageIndex = 1;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    localStorageMock.setItem('username', testUser);

    axios.get.mockResolvedValue({
      data: {
        username: testUser,
        profileImage: initialProfileImage,
        createdAt: new Date().toISOString(),
      },
    });

    axios.put.mockResolvedValue({
      data: {
        username: testUser,
        profileImage: '',
      }
    });
  });

  test('renders loading state initially and fetches user data', async () => {
    render(
      <Router>
        <Profile />
      </Router>
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    expect(axios.get).toHaveBeenCalledWith(`${apiEndpoint}/user/${testUser}`);
    expect(screen.getByLabelText(/Username/i)).toHaveValue(testUser);
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    const expectedImageAlt = `Profile image ${initialImageIndex + 1}`;
    expect(screen.getByAltText(expectedImageAlt)).toHaveAttribute('src', `/profile/${initialProfileImage}`);
    expect(screen.getByText(`Image ${initialImageIndex + 1} of ${TOTAL_IMAGES}`)).toBeInTheDocument();
  });

  test('handles error during user data fetch', async () => {
    const errorMessage = 'Failed to fetch user data';
    axios.get.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <Router>
        <Profile />
      </Router>
    );

    await waitFor(() => {
      expect(screen.queryByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
    });

    expect(screen.getByAltText(/Profile image 1/i)).toHaveAttribute('src', '/profile/profile_1.gif');
    expect(screen.getByLabelText(/Username/i)).toHaveValue(testUser);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  test('navigates through profile images using carousel buttons', async () => {
    render(
      <Router>
        <Profile />
      </Router>
    );

    const initialAltText = `Profile image ${initialImageIndex + 1}`;
    await waitFor(() => {
        expect(screen.getByAltText(initialAltText)).toBeInTheDocument();
    });


    const nextButton = screen.getByRole('button', { name: /next image/i });
    const prevButton = screen.getByRole('button', { name: /previous image/i });

    fireEvent.click(nextButton);
    let nextIndex = (initialImageIndex + 1) % TOTAL_IMAGES;
    await waitFor(() => {
        const expectedAlt = `Profile image ${nextIndex + 1}`;
        const expectedSrc = `/profile/profile_${nextIndex + 1}.gif`;
        expect(screen.getByAltText(expectedAlt)).toHaveAttribute('src', expectedSrc);
        expect(screen.getByText(`Image ${nextIndex + 1} of ${TOTAL_IMAGES}`)).toBeInTheDocument();
    });

    fireEvent.click(prevButton);
    let prevIndex1 = (nextIndex - 1 + TOTAL_IMAGES) % TOTAL_IMAGES;
     await waitFor(() => {
        const expectedAlt = `Profile image ${prevIndex1 + 1}`;
        const expectedSrc = `/profile/profile_${prevIndex1 + 1}.gif`;
        expect(screen.getByAltText(expectedAlt)).toHaveAttribute('src', expectedSrc);
        expect(screen.getByText(`Image ${prevIndex1 + 1} of ${TOTAL_IMAGES}`)).toBeInTheDocument();
    });

    fireEvent.click(prevButton);
    let prevIndex2 = (prevIndex1 - 1 + TOTAL_IMAGES) % TOTAL_IMAGES;
     await waitFor(() => {
        const expectedAlt = `Profile image ${prevIndex2 + 1}`;
        const expectedSrc = `/profile/profile_${prevIndex2 + 1}.gif`;
        expect(screen.getByAltText(expectedAlt)).toHaveAttribute('src', expectedSrc);
        expect(screen.getByText(`Image ${prevIndex2 + 1} of ${TOTAL_IMAGES}`)).toBeInTheDocument();
    });
  });

  test('updates profile image successfully on save', async () => {
    const newImageIndex = (initialImageIndex + 1) % TOTAL_IMAGES;
    const newImageFile = `profile_${newImageIndex + 1}.gif`;

    axios.put.mockResolvedValueOnce({
      data: {
        username: testUser,
        profileImage: newImageFile,
      }
    });

    render(
      <Router>
        <Profile />
      </Router>
    );

    const initialAltText = `Profile image ${initialImageIndex + 1}`;
    await waitFor(() => expect(screen.getByAltText(initialAltText)).toBeInTheDocument());

    const nextButton = screen.getByRole('button', { name: /next image/i });
    const saveButton = screen.getByRole('button', { name: /Save Profile Picture/i });

    fireEvent.click(nextButton);
    const nextAltText = `Profile image ${newImageIndex + 1}`;
    await waitFor(() => expect(screen.getByAltText(nextAltText)).toBeInTheDocument());

    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        `${apiEndpoint}/user/${testUser}/profile`,
        { profileImage: newImageFile }
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Profile image updated successfully!/i)).toBeInTheDocument();
      expect(saveButton).toBeDisabled();
    });
  });

  test('handles error during profile image update', async () => {
    const errorMessage = 'Failed to update profile image';
    axios.put.mockRejectedValueOnce(new Error(errorMessage));

    render(
      <Router>
        <Profile />
      </Router>
    );

    const initialAltText = `Profile image ${initialImageIndex + 1}`;
    await waitFor(() => expect(screen.getByAltText(initialAltText)).toBeInTheDocument());

    const nextButton = screen.getByRole('button', { name: /next image/i });
    const saveButton = screen.getByRole('button', { name: /Save Profile Picture/i });

    fireEvent.click(nextButton);
    const nextAltText = `Profile image ${(initialImageIndex + 1) % TOTAL_IMAGES + 1}`;
    await waitFor(() => expect(screen.getByAltText(nextAltText)).toBeInTheDocument());
    expect(saveButton).toBeEnabled();

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
    });

     expect(saveButton).toBeEnabled();
  });

   test('save button is disabled initially and toggles state correctly', async () => {
    render(
      <Router>
        <Profile />
      </Router>
    );

    const initialAltText = `Profile image ${initialImageIndex + 1}`;
    await waitFor(() => expect(screen.getByAltText(initialAltText)).toBeInTheDocument());

    const saveButton = screen.getByRole('button', { name: /Save Profile Picture/i });
    const nextButton = screen.getByRole('button', { name: /next image/i });
    const prevButton = screen.getByRole('button', { name: /previous image/i });

    expect(saveButton).toBeDisabled();

    fireEvent.click(nextButton);
    await waitFor(() => expect(saveButton).toBeEnabled());

    fireEvent.click(prevButton);
    await waitFor(() => expect(saveButton).toBeDisabled());
  });

   test('redirects to login if no username in localStorage', () => {
    localStorageMock.removeItem('username');

    render(
      <Router>
        <Profile />
      </Router>
    );

     expect(mockedNavigate).toHaveBeenCalledWith('/login');
  });

});