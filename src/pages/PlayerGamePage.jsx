import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import QuestionCard from '../components/game/QuestionCard';
import { useGameSocket } from '../hooks/useGameSocket';

const STORAGE_KEY = 'qontrol-player';

function readSession() {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
}

export default function PlayerGamePage() {
  const { roomCode } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { connected, subscribe, publish } = useGameSocket(roomCode);

  const [session] = useState(readSession);
  const [question, setQuestion] = useState(state?.firstQuestion ?? null);
  const [questionNumber, setQuestionNumber] = useState(state?.firstQuestion ? 1 : 0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [locked, setLocked] = useState(false);
  const questionStartRef = useRef(Date.now());

  useEffect(() => {
    if (!session || session.roomCode !== roomCode) {
      navigate('/join', { replace: true });
    }
  }, [session, roomCode, navigate]);

  useEffect(() => {
    const unsubscribe = subscribe('/question', (payload) => {
      setQuestion(payload);
      setQuestionNumber((n) => n + 1);
      setSelectedIndex(null);
      setLocked(false);
      questionStartRef.current = Date.now();
    });
    return unsubscribe;
  }, [subscribe]);

  useEffect(() => {
    const unsubscribe = subscribe('/game-over', (payload) => {
      navigate(`/results/${roomCode}`, { state: { finalPayload: payload, isHost: false } });
    });
    return unsubscribe;
  }, [subscribe, navigate, roomCode]);

  const handleSelect = (index, option) => {
    if (locked) return;
    setSelectedIndex(index);
    setLocked(true);
    // playerId if the backend assigned one during join, nickname as a
    // fallback correlation key — cheap insurance against DTO shape drift.
    publish('/answer', {
      optionId: option?.id ?? index,
      playerId: session?.playerId,
      nickname: session?.nickname,
      timeTakenMs: Date.now() - questionStartRef.current,
    });
  };

  return (
    <PageContainer roomCode={roomCode} status={connected ? 'LIVE' : 'RECONNECTING…'}>
      <div className="flex flex-col items-center px-4 py-12">
        {question ? (
          <QuestionCard
            question={question}
            questionNumber={questionNumber}
            interactive
            selectedIndex={selectedIndex}
            locked={locked}
            onSelect={handleSelect}
          />
        ) : (
          <p className="font-doodle text-chalk-dim mt-16">Waiting for the next question…</p>
        )}
      </div>
    </PageContainer>
  );
}
