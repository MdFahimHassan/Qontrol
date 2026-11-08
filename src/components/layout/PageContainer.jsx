import DoodleBackground from '../common/DoodleBackground';

const WIDTHS = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-5xl', xl: 'max-w-7xl' };

// Page body under the Navbar: consistent width and padding, optional doodles,
// optional vertical centering for single-purpose screens (join, waiting...).
export default function PageContainer({ children, width = 'md', doodles = false, center = false, className = '' }) {
  return (
    <main className="relative flex-1 w-full overflow-hidden">
      {doodles && <DoodleBackground variant="sparse" />}
      <div
        className={`relative z-10 mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 ${WIDTHS[width]} ${
          center ? 'flex flex-col items-center justify-center min-h-[70dvh] text-center' : ''
        } ${className}`}
      >
        {children}
      </div>
    </main>
  );
}