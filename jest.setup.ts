import '@testing-library/jest-dom'

// Provide a no-op fetch for components that call API routes (jsdom has no fetch)
global.fetch = jest.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) })
) as jest.Mock

// ResizeObserver is not implemented in jsdom — required by @xyflow/react
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
