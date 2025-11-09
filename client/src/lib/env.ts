export const getEnvVar = (key: string): string | undefined => {
  const importMetaEnv =
    typeof import.meta !== "undefined"
      ? (import.meta.env as unknown as Record<string, string | undefined>)
      : undefined;
  const processEnv =
    typeof process !== "undefined" ? (process.env as Record<string, string | undefined>) : undefined;

  return importMetaEnv?.[key] ?? processEnv?.[key];
};

