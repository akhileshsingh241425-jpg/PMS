import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 flex items-center justify-center mx-auto mb-4 border border-red-200">
              <span className="text-red-600 text-2xl font-bold">!</span>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-slate-500 mb-4">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
              className="px-4 py-2 bg-blue-700 text-white text-sm hover:bg-blue-800">
              Reload Page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
