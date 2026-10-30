import { Component, type ReactNode } from 'react'

/** Last-resort catch so a render crash shows the error instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <main className="main">
        <span className="eyebrow">SYSTEM / FAULT</span>
        <h1>Something broke</h1>
        <div className="notice callout-error" role="alert" style={{ marginTop: 24 }}>
          <span className="notice-tag">ERR</span>
          <div className="notice-body mono break">{error.message}</div>
        </div>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => location.reload()}>
          RELOAD →
        </button>
      </main>
    )
  }
}
