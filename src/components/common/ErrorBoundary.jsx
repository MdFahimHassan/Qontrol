import { Component } from 'react';

// Catches a crash in any page so the user sees a calm message instead of a blank screen.
// Plain <a>/<button> and hard navigation on purpose: if the app is broken, the router may be too.
export default class ErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('The UI crashed:', error, info?.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="min-h-screen grid place-items-center bg-pitch text-chalk px-6 text-center">
        <div className="max-w-md">
          <h1 className="font-display font-bold text-3xl mb-3">Something broke</h1>
          <p className="font-doodle text-xl text-chalk-dim mb-6">
            That wasn't supposed to happen. Reloading usually fixes it, and your game is still running.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-amber px-5 py-3 font-display font-bold text-pitch"
            >
              Reload
            </button>
            <a href="/" className="rounded-lg border border-turf-light px-5 py-3 font-display font-bold text-chalk">
              Back to home
            </a>
          </div>
        </div>
      </div>
    );
  }
}