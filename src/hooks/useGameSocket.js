import { useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { GameSocketContext } from '../context/GameSocketContext';
import { noticeFor, routeFor } from '../context/gameReducer';
import { useAuth } from './useAuth';

/** Raw access to the shared game state + actions. */
export function useGameSocket() {
  const ctx = useContext(GameSocketContext);
  if (!ctx) throw new Error('useGameSocket must be used within a GameSocketProvider');
  return ctx;
}

/**
 * Call at the top of every in-game page. It:
 *   1. makes sure a live session exists for this room (so a page refresh works),
 *   2. moves the browser to the page that matches the game phase,
 *   3. leaves the page if the session died (room gone, kicked, token expired).
 * `ready` is true once the first state from the server has arrived.
 */
export function useRoomSession(role, roomCode) {
  const game = useGameSocket();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { logout } = useAuth();

  const { roomCode: activeRoom, role: activeRole, phase, error, fatal, endedReason, connection } = game;
  const mine = activeRoom === roomCode && activeRole === role;

  // 1. open the session if this page was reached directly (refresh / shared link)
  useEffect(() => {
    if (mine) return;
    const attempt = role === 'HOST' ? game.enterAsHost(roomCode) : game.resumePlayer(roomCode);
    attempt.catch((err) => {
      if (err?.code === 'NO_SESSION') navigate(`/join/${roomCode}`, { replace: true });
    });
  }, [mine, role, roomCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. phase -> URL
  useEffect(() => {
    if (!mine) return;
    const target = routeFor(role, roomCode, phase);
    if (target && target !== pathname) {
      navigate(target, { replace: true, state: { notice: noticeFor(phase, endedReason) } });
    }
  }, [mine, phase, role, roomCode, pathname, endedReason]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. session died
  useEffect(() => {
    if (!mine || !fatal || !error) return;
    if (error.code === 'AUTH') {
      logout();
      navigate('/login', { replace: true, state: { notice: error.message } });
    } else {
      navigate(role === 'HOST' ? '/dashboard' : '/join', { replace: true, state: { notice: error.message } });
    }
  }, [mine, fatal, error]); // eslint-disable-line react-hooks/exhaustive-deps

  return { ...game, mine, ready: mine && connection !== 'idle' && phase !== null };
}