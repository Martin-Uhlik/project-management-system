// Counts failed sign-ins in memory (one backend process), per client IP and per user name, in a sliding window.
// After too many failures, further attempts from that IP or for that user name are refused until the window passes.

export type LoginLimiterOptions = {
    windowMs: number;
    maxFailuresPerName: number;
    maxFailuresPerIp: number;
};

export const defaultLoginLimits: LoginLimiterOptions = {
    windowMs: 15 * 60 * 1000,
    maxFailuresPerName: 10,
    maxFailuresPerIp: 50,
};

export const createLoginLimiter = (options: LoginLimiterOptions = defaultLoginLimits) => {
    const failures = new Map<string, number[]>();

    const recent = (key: string, now: number) => {
        const times = (failures.get(key) ?? []).filter((time) => now - time < options.windowMs);
        if (times.length) failures.set(key, times);
        else failures.delete(key);
        return times;
    };

    const keys = (ip: string, name: string) => ({ ipKey: `ip:${ip}`, nameKey: `name:${name.toLowerCase()}` });

    return {
        // Seconds until another attempt is allowed, or 0 when it is allowed now
        retryAfter(ip: string, name: string, now = Date.now()) {
            const { ipKey, nameKey } = keys(ip, name);
            let wait = 0;
            for (const [key, max] of [
                [ipKey, options.maxFailuresPerIp],
                [nameKey, options.maxFailuresPerName],
            ] as const) {
                const times = recent(key, now);
                if (times.length >= max) {
                    wait = Math.max(wait, times[times.length - max] + options.windowMs - now);
                }
            }
            return Math.ceil(wait / 1000);
        },
        fail(ip: string, name: string, now = Date.now()) {
            const { ipKey, nameKey } = keys(ip, name);
            for (const key of [ipKey, nameKey]) {
                failures.set(key, [...recent(key, now), now]);
            }
        },
        // A successful sign-in clears the user name's count (not the IP's)
        succeed(name: string) {
            failures.delete(keys('', name).nameKey);
        },
    };
};

export type LoginLimiter = ReturnType<typeof createLoginLimiter>;
