import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Placeholder import check for pages (we will build these next)
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import QuizBuilderPage from './pages/QuizBuilderPage';
import JoinGamePage from './pages/JoinGamePage';
import HostLobbyPage from './pages/HostLobbyPage';
import PlayerLobbyPage from './pages/PlayerLobbyPage';
import HostGamePage from './pages/HostGamePage';
import PlayerGamePage from './pages/PlayerGamePage';
import FinalResultsPage from './pages/FinalResultsPage';

// Protected Route Component for Host Screens
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <div className="min-h-screen bg-pitch text-chalk font-body">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

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
          path="/host/lobby/:roomCode"
          element={
            <ProtectedRoute>
              <HostLobbyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/host/game/:roomCode"
          element={
            <ProtectedRoute>
              <HostGamePage />
            </ProtectedRoute>
          }
        />

        {/* Player Routes — no login, just nickname + room code */}
        <Route path="/join" element={<JoinGamePage />} />
        <Route path="/play/lobby/:roomCode" element={<PlayerLobbyPage />} />
        <Route path="/play/game/:roomCode" element={<PlayerGamePage />} />

        {/* Shared — host and player both land here off /game-over */}
        <Route path="/results/:roomCode" element={<FinalResultsPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;