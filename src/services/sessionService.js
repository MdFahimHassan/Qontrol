import api from './api';

// Milestone 2: host taps "Host Game" on a saved quiz → backend spins up a
// game_sessions row + in-memory room state and hands back a room code for
// players to join. Not part of the original file skeleton — added because
// the lobby screens need somewhere to get a roomCode from before they can
// open a socket.
export const sessionService = {
  startSession: async (quizId) => {
    const response = await api.post(`/api/sessions/start/${quizId}`);
    return response.data; // Expecting { sessionId, roomCode, quizId, status }
  },
};
