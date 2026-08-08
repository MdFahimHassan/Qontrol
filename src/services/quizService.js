import api from './api';

export const quizService = {
  // Fetch quizzes created by logged-in host
  getMyQuizzes: async () => {
    const response = await api.get('/api/quizzes/my');
    return response.data;
  },

  // Fetch a single quiz by ID
  getQuizById: async (id) => {
    const response = await api.get(`/api/quizzes/${id}`);
    return response.data;
  },

  // Create a new quiz with questions & options
  createQuiz: async (quizData) => {
    const response = await api.post('/api/quizzes', quizData);
    return response.data;
  },

  // Edit existing quiz
  updateQuiz: async (id, quizData) => {
    const response = await api.put(`/api/quizzes/${id}`, quizData);
    return response.data;
  },

  // Delete quiz
  deleteQuiz: async (id) => {
    const response = await api.delete(`/api/quizzes/${id}`);
    return response.data;
  },
};