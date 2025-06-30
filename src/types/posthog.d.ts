// PostHog global type declarations
declare global {
  interface Window {
    posthog?: {
      capture: (eventName: string, properties?: Record<string, any>) => void;
      identify: (userId: string, properties?: Record<string, any>) => void;
      reset: () => void;
      isFeatureEnabled: (flagKey: string) => boolean;
      getFeatureFlag: (flagKey: string) => boolean | string | undefined;
      people: {
        set: (properties: Record<string, any>) => void;
      };
    };
  }
}

export {};