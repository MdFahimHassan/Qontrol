import { createContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createGameClient } from '../services/gameClient';
import { gameReducer, initialGameState } from './gameReducer';

export const GameSocketContext = createContext(null);

// Pages that belong to a live game. Walking away from them closes the socket.
const GAME_PATHS = /^\/(host|play|join)(\/|$)/;

/**
 * Holds ONE game connection for the whole app, so the socket survives the
 * lobby -> question -> results page changes. `socketFactory` can be swapped
 * in tests.
 */
export function GameSocketProvider({ children, socketFactory }) {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const { token } = useAuth();
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const clientRef = useRef(null);
  if (!clientRef.current) {
    clientRef.current = createGameClient({
      dispatch,
      getState: () => stateRef.current,
      socketFactory,
    });
  }
  const game = clientRef.current;

  const { pathname } = useLocation();
  useEffect(() => {
    if (!GAME_PATHS.test(pathname)) game.leave();
  }, [pathname, game]);

  // Close the socket if the whole provider goes away (e.g. hot reload).
  useEffect(() => () => game.leave(), [game]);

  const actions = useMemo(
    () => ({
      ...game,
      enterAsHost: (roomCode) => game.enterAsHost(roomCode, tokenRef.current),
    }),
    [game]
  );

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);
  return <GameSocketContext.Provider value={value}>{children}</GameSocketContext.Provider>;
}