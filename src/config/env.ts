const normalizeEnvValue = (value: string | undefined): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const env = {
  defaultUsername: normalizeEnvValue(import.meta.env.VITE_DEFAULT_USERNAME),
  defaultPassword: normalizeEnvValue(import.meta.env.VITE_DEFAULT_PASSWORD)
};
