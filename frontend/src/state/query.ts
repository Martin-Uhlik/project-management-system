import { useEffect } from 'react';
import { hashKey, QueryClient, useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import axios from 'axios';
import { getBackendAddress } from '../config';
import { notificationsAtom } from './atoms';
import { handleAxiosError } from '../errorHandler';

// The data the screens show, loaded over REST once and kept (TanStack Query): opening a page again shows what was
// loaded before instead of loading it again. Nothing is reloaded on a timer or when the window gets focus: cached data
// only goes stale when the live connection says it changed (invalidateTopics, called from state/live.js), after a
// change made in this browser (tickAtom) or after the live connection was down (both invalidateAll, see LiveUpdates).
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Infinity,
            // data no screen has shown for half an hour is dropped (loaded again when it's opened next)
            gcTime: 30 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            // a failed request shows its error at once, like before
            retry: false,
        },
    },
});

// The cache key of a GET: its path and query parameters
export type Params = Record<string, unknown>;

export const apiKey = (path: string, params?: Params) => (params ? [path, params] : [path]);

export const fetchApi = <T = unknown>(path: string, params?: Params, signal?: AbortSignal): Promise<T> =>
    axios.get(getBackendAddress(path), { params, signal }).then((response) => response.data as T);

// Which live topics each cached answer depends on (query hash -> topics), collected from every useApi call that shows
// it. A topic such as "user:*" stands for every "user:<id>".
const queryTopics = new Map<string, Set<string>>();

const registerTopics = (queryKey: unknown[], topics: string[]) => {
    if (!topics.length) return;
    const hash = hashKey(queryKey);
    const own = queryTopics.get(hash) ?? new Set();
    topics.forEach((topic) => own.add(topic));
    queryTopics.set(hash, own);
};

const matches = (own: string, changed: string) => own === changed || (own.endsWith(':*') && changed.startsWith(own.slice(0, -1)));

// The live connection said these topics changed: every cached answer that depends on one of them goes stale. What's on
// screen loads again now, the rest when it's opened next.
export const invalidateTopics = (changed: string[]) =>
    queryClient.invalidateQueries({
        predicate: (query) => {
            const own = queryTopics.get(query.queryHash);
            return !!own && changed.some((topic) => [...own].some((topicOwn) => matches(topicOwn, topic)));
        },
    });

// Everything goes stale (a change made in this browser, or the live connection was down for a while)
export const invalidateAll = () => queryClient.invalidateQueries();

// Signing out (or in as someone else) starts with an empty cache
export const clearCache = () => {
    queryClient.clear();
    queryTopics.clear();
};

// A GET of the backend's API (path such as "/auth/projects"), cached. topics: the live topics that make it stale (see
// backend/src/live.ts; the same names useLive took). enabled: false waits (e.g. for an id).
// quiet: no error notification (an optional request). Returns TanStack Query's result: data is undefined until the
// first answer.
export interface ApiOptions {
    params?: Params;
    topics?: string[];
    enabled?: boolean;
    quiet?: boolean;
}

export const useApi = <T = unknown>(path: string, { params, topics = [], enabled = true, quiet = false }: ApiOptions = {}) => {
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const queryKey = apiKey(path, params);
    registerTopics(queryKey, topics);
    const query = useQuery<T>({
        queryKey,
        queryFn: ({ signal }) => fetchApi<T>(path, params, signal),
        enabled,
    });

    // the same error notification the screens showed before
    useEffect(() => {
        if (query.error && !quiet) handleAxiosError(query.error, [notifications, setNotifications]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query.errorUpdatedAt]);

    return query;
};

// Loads the data most screens need as soon as someone signs in, so the first pages open without waiting (the same
// keys and topics as the screens that show it)
export const prefetchStart = (userID: number | string) => {
    (
        [
            ['/auth/projects', ['projects', 'users']],
            ['/auth/users', ['users']],
            ['/auth/machines', ['machines']],
            [`/auth/users/${userID}`, [`user:${userID}`]],
            [`/auth/${userID}/tasks`, [`user:${userID}`]],
            [`/auth/${userID}/personal-tasks`, [`personal-tasks:${userID}`]],
        ] as [string, string[]][]
    ).forEach(([path, topics]) => {
        registerTopics(apiKey(path), topics);
        queryClient.prefetchQuery({ queryKey: apiKey(path), queryFn: ({ signal }) => fetchApi(path, undefined, signal) });
    });
};
