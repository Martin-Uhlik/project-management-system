import { useMemo, useState } from 'react';

// lower case and without diacritics, so 'zakaznik' finds 'Zákazník'
const normalize = (text) =>
    String(text ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase();

// Live search over a list. toText(item) returns the values to search in (a string or an array of them).
// Every word typed has to appear somewhere in the item. Returns { query, setQuery, results } for StyledSearchInput / StyledTable.
export const useSearch = (items, toText) => {
    const [query, setQuery] = useState('');
    const results = useMemo(() => {
        const list = items ?? [];
        const words = normalize(query).split(/\s+/).filter(Boolean);
        if (words.length === 0) return list;
        return list.filter((item) => {
            const text = normalize([toText(item)].flat().join(' '));
            return words.every((word) => text.includes(word));
        });
        // toText is usually an inline function; the result only depends on the items and the query
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, query]);
    return { query, setQuery, results };
};
