import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('React render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="boot-screen error-boundary">
          <div className="brand-mark">I</div>
          <h1>Something went wrong</h1>
          <p>Refresh the page and try again.</p>
        </main>
      );
    }

    return this.props.children;
  }
}
