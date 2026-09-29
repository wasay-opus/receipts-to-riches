type IdleDeadlineLike = {
  didTimeout: boolean;
  timeRemaining: () => number;
};

type RequestIdleCallbackLike = (
  callback: (deadline: IdleDeadlineLike) => void,
  options?: { timeout?: number },
) => number;

type CancelIdleCallbackLike = (handle: number) => void;

type IdleGlobals = typeof globalThis & {
  requestIdleCallback?: RequestIdleCallbackLike;
  cancelIdleCallback?: CancelIdleCallbackLike;
};

const idleGlobals = globalThis as IdleGlobals;

export const runWhenIdle = (
  callback: () => void,
  timeout = 500,
): (() => void) => {
  let cancelled = false;

  const run = () => {
    if (!cancelled) {
      callback();
    }
  };

  if (typeof idleGlobals.requestIdleCallback === 'function') {
    const handle = idleGlobals.requestIdleCallback(() => {
      run();
    }, { timeout });

    return () => {
      cancelled = true;
      if (typeof idleGlobals.cancelIdleCallback === 'function') {
        idleGlobals.cancelIdleCallback(handle);
      }
    };
  }

  const handle = setTimeout(run, 0);

  return () => {
    cancelled = true;
    clearTimeout(handle);
  };
};

export default runWhenIdle;
