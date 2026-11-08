import { Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { useAuth } from './hooks/useAuth';
import { GameSocketProvider } from './context/GameSocketContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import QuizBuilderPage from './pages/QuizBuilderPage';
import JoinGamePage from './pages/JoinGamePage';
import PlayerLobbyPage from './pages/PlayerLobbyPage';
import PlayerGamePage from './pages/PlayerGamePage';
import HostLobbyPage from './pages/HostLobbyPage';
import HostGamePage from './pages/HostGamePage';
import FinalResultsPage from './pages/FinalResultsPage';

// Protected Route Component for Host Screens
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// `socketFactory` is only passed by tests; in the real app the default socket is used.
function App({ socketFactory }) {
  return (
    <MotionConfig reducedMotion="user">
      <GameSocketProvider socketFactory={socketFactory}>
        <div className="min-h-screen bg-pitch text-chalk font-body">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Players: no account, just a PIN and a nickname */}
            <Route path="/join" element={<JoinGamePage />} />
            <Route path="/join/:code" element={<JoinGamePage />} />
            <Route path="/play/:roomCode" element={<PlayerLobbyPage />} />
            <Route path="/play/:roomCode/live" element={<PlayerGamePage />} />
            <Route path="/play/:roomCode/results" element={<FinalResultsPage />} />

            {/* Protected Host Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/new"
              element={
                <ProtectedRoute>
                  <QuizBuilderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/edit/:id"
              element={
                <ProtectedRoute>
                  <QuizBuilderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/host/:roomCode"
              element={
                <ProtectedRoute>
                  <HostLobbyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/host/:roomCode/live"
              element={
                <ProtectedRoute>
                  <HostGamePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/host/:roomCode/results"
              element={
                <ProtectedRoute>
                  <FinalResultsPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </GameSocketProvider>
    </MotionConfig>
  );
}

export default App;