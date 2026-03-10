function normalizeNavigationTarget(target: string) {
  const url = new URL(target, window.location.origin);

  return `${url.pathname}${url.search}${url.hash}`;
}

export function navigateTo(target: string) {
  if (normalizeNavigationTarget(window.location.href) === normalizeNavigationTarget(target)) {
    return;
  }

  window.history.pushState({}, "", target);
  window.dispatchEvent(new Event("app:navigate"));
}
