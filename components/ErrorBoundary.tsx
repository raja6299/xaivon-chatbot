"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error locally without exposing stack traces to the user
    console.error("[ErrorBoundary] Caught exception in child component:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Unmount the component cleanly without disrupting the parent application
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}
