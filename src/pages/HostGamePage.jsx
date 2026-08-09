import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import QuestionCard from '../components/game/QuestionCard';
import Button from '../components/common/Button';
import { useGameSocket } from '../hooks/useGameSocket';

export default function HostGamePage() {
  const { roomCode } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { connected, subscribe, publish } = useGameSocket(roomCode);

  const [question, setQuestion] = useState(state?.firstQuestion ?? null);
  const [questionNumber, setQuestionNumber] = useState(state?.firstQuestion ? 1 : 0);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribe('/question', (payload) => {
      setQuestion(payload);
      setQuestionNumber((n) => n + 1);
      setAdvancing(false);
    });
    return unsubscribe;
  }, [subscribe]);

  // Server-driven — fires instead of another /question once the quiz runs
  // out of questions, so "Next" doesn't need to know the question count.
  useEffect(() => {
    const unsubscribe = subscribe('/game-over', (payload) => {
      navigate(`/results/${roomCode}`, { state: { finalPayload: payload, isHost: true } });
    });
    return unsubscribe;
  }, [subscribe, navigate, roomCode]);

  const handleNext = () => {
    setAdvancing(true);
    publish('/next');
  };

  return (
    <PageContainer roomCode={roomCode} status={connected ? 'LIVE' : 'RECONNECTING…'}>
      <div className="flex flex-col items-center px-4 py-12">
        {question ? (
          <QuestionCard question={question} questionNumber={questionNumber} />
        ) : (
          <p className="font-doodle text-chalk-dim mt-16">Waiting for question…</p>
        )}

        <Button
          size="lg"
          className="mt-8"
          loading={advancing}
          disabled={advancing}
          onClick={handleNext}
        >
          {advancing ? 'ADVANCING…' : 'NEXT QUESTION →'}
        </Button>
      </div>
    </PageContainer>
  );
}
