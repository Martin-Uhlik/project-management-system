import { formatAmount, formatPrice, requestState, stockState, taskLabel, taskLink } from './format';
import { stockHistory } from './StockChart';
import type { MaterialEvent } from '../../types';

test('stockState: short when more is reserved than in stock, low under the minimum', () => {
    expect(stockState({ Count: 5, Reserved: 8, Available: -3, MinCount: 0 })).toBe('short');
    expect(stockState({ Count: 10, Reserved: 6, Available: 4, MinCount: 5 })).toBe('low');
    expect(stockState({ Count: 10, Reserved: 0, Available: 10, MinCount: 5 })).toBe('ok');
    // no minimum set: never low
    expect(stockState({ Count: 0, Reserved: 0, Available: 0, MinCount: 0 })).toBe('ok');
});

test('amounts, prices, tasks and requests are written for people', () => {
    expect(formatPrice(12500)).toBe('12 500 Kč');
    expect(formatAmount(3, 'm')).toBe('3 m');
    expect(formatAmount(null, '')).toBe('0 ks');
    expect(taskLabel({ Name: 'Frézování', Project: { Name: 'Rám' } })).toBe('Rám / Frézování');
    expect(taskLabel(null)).toBeNull();
    expect(taskLink({ ID: 7, ProjectID: 3 })).toBe('/auth/projects/3/7');
    expect(requestState({ AcceptedByID: null })).toBe('waiting');
    expect(requestState({ AcceptedByID: 2 })).toBe('approved');
});

let nextID = 1;
const event = (EventType: MaterialEvent['EventType'], Count: number, TargetTaskID: number | null = null): MaterialEvent => ({
    ID: nextID++,
    EventType,
    Count,
    TargetTaskID,
    MaterialID: 1,
    CreatedAt: `2026-11-${String(nextID).padStart(2, '0')}T10:00:00Z`,
});

test('stockHistory follows the stock and what is available after each movement', () => {
    // the API sends the newest movement first
    const events = [event('ADD', 10), event('RESERVATION', 4, 1), event('REMOVE', 3, 1), event('RELEASE', 1, 1), event('REMOVE', 2)].reverse();
    expect(stockHistory(events).map(({ count, available }) => [count, available])).toEqual([
        [10, 10],
        // 4 set aside for task 1
        [10, 6],
        // 3 taken for task 1 use its reservation up
        [7, 6],
        // the last one given back
        [7, 7],
        // taken without a task
        [5, 5],
    ]);
});

test('stockHistory: taking more for a task than reserved does not reserve negative amounts', () => {
    const events = [event('ADD', 10), event('RESERVATION', 2, 5), event('REMOVE', 5, 5)].reverse();
    expect(stockHistory(events).at(-1)).toMatchObject({ count: 5, available: 5 });
});
