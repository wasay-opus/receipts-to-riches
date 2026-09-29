/// <reference types="vite/client" />

declare const __DEV__: boolean;

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

declare module '*.mp3' {
  const value: string;
  export default value;
}

declare module '*.wav' {
  const value: string;
  export default value;
}

declare module '*.json' {
  const value: any;
  export default value;
}
