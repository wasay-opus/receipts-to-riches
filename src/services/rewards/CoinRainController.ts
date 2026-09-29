type Listener = () => void;

class CoinRainControllerClass {
  private sequence = 0;

  private listeners = new Set<Listener>();

  start = (): number => {
    this.sequence += 1;
    this.notify();
    return this.sequence;
  };

  getSnapshot = (): number => {
    return this.sequence;
  };

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  };

  reset = (): void => {
    this.sequence = 0;
    this.notify();
  };

  private notify = (): void => {
    this.listeners.forEach(listener => listener());
  };
}

export const CoinRainController = new CoinRainControllerClass();
