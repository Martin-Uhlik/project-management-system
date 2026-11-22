import { describe, expect, it } from 'vitest';
import { stockOf } from '../src/resources/material.ts';

type Event = Parameters<typeof stockOf>[0][number];
const event = (EventType: Event['EventType'], Count: number, TargetTaskID: number | null = null): Event => ({ EventType, Count, TargetTaskID });

describe('stockOf', () => {
    it('counts what is in stock from what was put in and taken out', () => {
        expect(stockOf([])).toEqual({ Count: 0, Reserved: 0, Available: 0 });
        expect(stockOf([event('ADD', 10), event('REMOVE', 3), event('ADD', 2)])).toEqual({ Count: 9, Reserved: 0, Available: 9 });
    });

    it('takes items out for a task from its reservation, and a release gives the rest back', () => {
        const events = [event('ADD', 10), event('RESERVATION', 5, 1), event('REMOVE', 2, 1)];
        expect(stockOf(events)).toEqual({ Count: 8, Reserved: 3, Available: 5 });
        expect(stockOf([...events, event('RELEASE', 3, 1)])).toEqual({ Count: 8, Reserved: 0, Available: 8 });
    });

    it('keeps the reservations of each task (and those without a task) apart', () => {
        const events = [event('ADD', 10), event('RESERVATION', 4, 1), event('RESERVATION', 3), event('REMOVE', 6, 1)];
        // task 1 took more than it reserved: its reservation is used up, not negative; the general one stays
        expect(stockOf(events)).toEqual({ Count: 4, Reserved: 3, Available: 1 });
    });

    it('can show more reserved than is in stock (the item is short)', () => {
        expect(stockOf([event('ADD', 2), event('RESERVATION', 5, 7)])).toEqual({ Count: 2, Reserved: 5, Available: -3 });
    });
});
