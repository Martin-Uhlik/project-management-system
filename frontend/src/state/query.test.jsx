import { renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { afterEach, vi } from 'vitest';
import { clearCache, invalidateAll, invalidateTopics, queryClient, useApi } from './query';

afterEach(() => {
    vi.restoreAllMocks();
    clearCache();
});

const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;

// GET answers: the path and how many times it was asked for
const backend = () => {
    const calls = {};
    vi.spyOn(axios, 'get').mockImplementation((url) => {
        const path = url.slice(url.indexOf('/auth'));
        calls[path] = (calls[path] ?? 0) + 1;
        return Promise.resolve({ data: { path, version: calls[path] } });
    });
    return calls;
};

test('a page opened again shows the cached data without loading it again', async () => {
    const calls = backend();
    const first = renderHook(() => useApi('/auth/projects', { topics: ['projects'] }), { wrapper });
    await waitFor(() => expect(first.result.current.data?.version).toBe(1));
    first.unmount();

    const again = renderHook(() => useApi('/auth/projects', { topics: ['projects'] }), { wrapper });
    expect(again.result.current.data?.version).toBe(1);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(calls['/auth/projects']).toBe(1);
});

test('a live topic reloads only the data that depends on it', async () => {
    const calls = backend();
    const { result } = renderHook(
        () => ({
            projects: useApi('/auth/projects', { topics: ['projects'] }),
            stats: useApi('/auth/stats/people', { topics: ['users', 'user:*'] }),
        }),
        { wrapper },
    );
    await waitFor(() => expect(result.current.projects.data && result.current.stats.data).toBeTruthy());

    await invalidateTopics(['user:7']);
    await waitFor(() => expect(result.current.stats.data?.version).toBe(2));
    expect(calls['/auth/projects']).toBe(1);

    await invalidateTopics(['projects']);
    await waitFor(() => expect(result.current.projects.data?.version).toBe(2));
    expect(calls['/auth/stats/people']).toBe(2);
});

test('a change made in this browser reloads everything shown', async () => {
    const calls = backend();
    const machines = renderHook(() => useApi('/auth/machines', { topics: ['machines'] }), { wrapper });
    await waitFor(() => expect(machines.result.current.data).toBeDefined());
    await invalidateAll();
    await waitFor(() => expect(calls['/auth/machines']).toBe(2));
});
