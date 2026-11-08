import LoadingSpinner from '../common/LoadingSpinner';
import Navbar from '../layout/Navbar';

// Shown while a page waits for its first state from the server (e.g. after a refresh).
export default function RoomLoading({ message = 'Connecting to the game…' }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-pitch text-chalk">
      <Navbar showMute={false} />
      <div className="flex-1 grid place-items-center">
        <div className="flex items-center gap-3 text-chalk-dim font-doodle text-xl">
          <LoadingSpinner size={22} />
          {message}
        </div>
      </div>
    </div>
  );
}