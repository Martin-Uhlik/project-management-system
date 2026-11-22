import { useApi } from './query';

// Whether this is the public demo (the backend's DEMO_MODE): there uploads are off and the data goes back to its
// starting state every night. Read from GET /auth/me, loaded once and cached.
export const useDemoMode = () => useApi<{ Demo?: boolean }>('/auth/me', { quiet: true }).data?.Demo === true;

export const demoUploadsOff = 'V ukázkové verzi nelze nahrávat soubory.';
