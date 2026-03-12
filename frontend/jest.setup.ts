import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
  window.localStorage.clear();
  window.sessionStorage.clear();
  jest.clearAllMocks();
  jest.useRealTimers();
});
