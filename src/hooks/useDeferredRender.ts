import { useEffect, useState } from 'react';
import runWhenIdle from '../utils/runWhenIdle';

const useDeferredRender = (delay = 200) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const cancelIdleTask = runWhenIdle(() => {
      timer = setTimeout(() => {
        if (isMounted) {
          setReady(true);
        }
      }, delay);
    });

    return () => {
      isMounted = false;
      cancelIdleTask();
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [delay]);

  return ready;
};

export default useDeferredRender;
