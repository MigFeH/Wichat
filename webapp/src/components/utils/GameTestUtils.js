export const mockGame = {
    fetchQuestions: jest.fn()
};

export const mockNavigate = jest.fn();

export const mockQuestion = {
    answers: {
        'Madrid': 'madrid-image-url',
        'Paris': 'paris-image-url'
    },
    correct: 'Madrid'
};

export const setupTest = () => {
    jest.clearAllMocks();
    localStorage.setItem('username', 'testUser');
    jest.useFakeTimers();
};

export const cleanupTest = () => {
    localStorage.clear();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
};