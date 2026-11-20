import { useEffect } from 'react';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import axios from 'axios';
import { io } from 'socket.io-client';
import dayjs from '../dayjs';
import { getBackendAddress } from '../config';
import { tickAtom } from './atoms';

// Live updates: the backend tells this browser which data other people changed (topics such as "projects",
// "project:12" or "user:5", see backend/src/live.ts), and the screens showing it load it again over REST.
// Changes made in this browser still reload the screen through tickAtom.

// how many times each topic changed since the page was opened; "user:*" counts every "user:<id>"
const liveVersionsAtom = atom({});

// this browser's connection, sent with every change (X-Socket-ID) so the backend doesn't tell it about its own change
let socketID = null;
export const liveSocketID = () => socketID;

// many changes at once (a project with many tasks) reload a screen once
const BATCH_MS = 100;

const bump = (versions, topics) => {
    const next = { ...versions };
    for (const topic of topics) {
        next[topic] = (next[topic] ?? 0) + 1;
        const kind = topic.split(':')[0];
        if (kind !== topic) next[`${kind}:*`] = (next[`${kind}:*`] ?? 0) + 1;
    }
    return next;
};

// Connects while a user is signed in (rendered once, in Auth)
export const LiveUpdates = () => {
    const setVersions = useSetAtom(liveVersionsAtom);
    const setTick = useSetAtom(tickAtom);

    useEffect(() => {
        // the API's address may carry a path (behind a proxy): the connection goes to <that path>/live
        const backend = new URL(import.meta.env.VITE_BACKEND, window.location.href);
        const socket = io(backend.origin, { path: `${backend.pathname.replace(/\/$/, '')}/live`, withCredentials: true });
        const pending = new Set();
        let flushTimer = null;
        let connectedBefore = false;

        socket.on('changed', (topics) => {
            topics.forEach((topic) => pending.add(topic));
            if (flushTimer) return;
            flushTimer = setTimeout(() => {
                const topics = [...pending];
                pending.clear();
                flushTimer = null;
                setVersions((versions) => bump(versions, topics));
            }, BATCH_MS);
        });

        socket.on('connect', () => {
            socketID = socket.id;
            // changes made while the connection was down were not announced: reload everything shown
            if (connectedBefore) setTick(dayjs());
            connectedBefore = true;
        });

        socket.on('disconnect', (reason) => {
            socketID = null;
            // the server closed it (the session ended, or the role changed): connect again, which checks the session
            if (reason === 'io server disconnect') setTimeout(() => socket.connect(), 1000);
        });

        // the session is no longer valid: any API call now answers 401, and the axios interceptor (index.jsx) signs out
        socket.on('connect_error', (error) => {
            if (error?.message === 'unauthorized') axios.get(getBackendAddress('/auth/me')).catch(() => {});
        });

        return () => {
            clearTimeout(flushTimer);
            socket.disconnect();
            socketID = null;
        };
    }, [setVersions, setTick]);

    return null;
};

// A value for a useEffect's dependencies that changes whenever one of the topics changes (or the screen should reload
// after a change made in this browser, see tickAtom)
export const useLive = (...topics) => {
    const tick = useAtomValue(tickAtom);
    const versions = useAtomValue(liveVersionsAtom);
    return `${tick.valueOf()}|${topics.map((topic) => versions[topic] ?? 0).join(',')}`;
};
