import { useEffect, useState } from 'react';

const pad = (n) => String(n).padStart(2, '0');

// The time since `since` (a date, or null) as 'H:MM:SS', ticking every second; '0:00:00' without a start
export const useElapsed = (since) => {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (!since) return undefined;
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [since]);
    if (!since) return '0:00:00';
    const seconds = Math.max(0, Math.floor((now - new Date(since).getTime()) / 1000));
    return `${Math.floor(seconds / 3600)}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`;
};
