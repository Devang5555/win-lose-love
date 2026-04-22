import { Component, type ErrorInfo, type ReactNode } from "react";

interface ChunkErrorBoundaryProps {
  children: ReactNode;
}

interface ChunkErrorBoundaryState {
  hasError: boolean;
}

const isChunkLoadError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed") ||
    message.includes("ChunkLoadError")
  );
};

class ChunkErrorBoundary extends Component<ChunkErrorBoundaryProps, ChunkErrorBoundaryState> {
  state: ChunkErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(error: unknown): ChunkErrorBoundaryState {
    if (isChunkLoadError(error)) {
      return { hasError: true };
    }

    throw error;
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error("Chunk load error boundary caught an error", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-6">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-foreground">Refreshing the latest update</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The page changed while this screen was open. Reload once to fetch the newest files.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChunkErrorBoundary;