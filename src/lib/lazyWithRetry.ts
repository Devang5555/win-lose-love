import { lazy, type ComponentType } from "react";

const isChunkLoadError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed") ||
    message.includes("ChunkLoadError")
  );
};

export const lazyWithRetry = <T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
  cacheKey: string,
) =>
  lazy(async () => {
    const retryKey = `lazy-retry:${cacheKey}`;

    try {
      const component = await importer();
      sessionStorage.removeItem(retryKey);
      return component;
    } catch (error) {
      if (isChunkLoadError(error) && !sessionStorage.getItem(retryKey)) {
        sessionStorage.setItem(retryKey, "true");
        window.location.reload();
        return new Promise<never>(() => undefined);
      }

      sessionStorage.removeItem(retryKey);
      throw error;
    }
  });