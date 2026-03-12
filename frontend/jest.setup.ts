import { cleanup } from "@testing-library/react";

const originalFetch = global.fetch;

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
  window.localStorage.clear();
  window.sessionStorage.clear();
  if (originalFetch === undefined) {
    delete (global as { fetch?: typeof fetch }).fetch;
  } else {
    Object.defineProperty(global, "fetch", {
      configurable: true,
      writable: true,
      value: originalFetch
    });
  }
  jest.clearAllMocks();
  jest.useRealTimers();
});
