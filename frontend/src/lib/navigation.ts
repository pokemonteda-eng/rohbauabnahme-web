function normalizeNavigationTarget(target: string) {
  const url = new URL(target, window.location.origin);

  return `${url.pathname}${url.search}${url.hash}`;
}

type NavigateOptions = {
  replace?: boolean;
};

export function navigateTo(target: string, options?: NavigateOptions) {
  if (normalizeNavigationTarget(window.location.href) === normalizeNavigationTarget(target)) {
    return;
  }

  if (options?.replace) {
    window.history.replaceState({}, "", target);
  } else {
    window.history.pushState({}, "", target);
  }

  window.dispatchEvent(new Event("app:navigate"));
}
