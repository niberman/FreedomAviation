export const getEnvVar = (key: string): string | undefined => {
  // In Next.js, we only use process.env for environment variables
  // Server components and API routes use process.env directly
  // Client components can only access NEXT_PUBLIC_* variables via process.env
  const processEnv =
    typeof process !== "undefined" ? (process.env as Record<string, string | undefined>) : undefined;

  return processEnv?.[key];
};
