import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application rendering error', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12" role="alert">
          <h1 className="text-2xl font-bold text-slate-900">This page could not be displayed</h1>
          <p className="mt-3 text-slate-700">Your latest saved project remains stored on this device. Reload the page to try again.</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-6 w-fit rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800">
            Reload application
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}
