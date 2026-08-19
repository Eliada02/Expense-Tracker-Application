import { Component } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: var(--space-6);
  text-align: center;

  div {
    max-width: 480px;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  p {
    color: var(--text-muted);
  }

  button {
    align-self: center;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-strong);
    background: var(--surface);
    cursor: pointer;
  }
`;

/**
 * Last line of defence: a render error shows a recoverable message instead of
 * a blank page. Data-fetching failures are handled per query, not here.
 */
export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <Wrapper>
        <div>
          <h1>Something went wrong</h1>
          <p>{this.state.error.message}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload the app
          </button>
        </div>
      </Wrapper>
    );
  }
}

export default ErrorBoundary;
