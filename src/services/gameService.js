import api from './api';

// REST side of live games. Everything real-time goes through socketService.
export const gameService = {
  // Host: open a lobby for one of their quizzes -> { roomCode, quizTitle, questionCount }
  createGame: async (quizId) => {
    const response = await api.post('/api/games', { quizId });
    return response.data;
  },

  // Public: does this PIN exist, and is it still in the lobby? -> { state, playerCount, quizTitle }
  getStatus: async (roomCode) => {
    const response = await api.get(`/api/games/${roomCode}/status`);
    return response.data;
  },
};