import { useSyncExternalStore } from 'react';

// Which items a list shows, chosen with the gear next to its title (ListFiltersButton → ListFilters dialog). Each list
// has its own on/off options; the choice is kept in this browser (localStorage, one key per list).
// hidden: the button's tooltip while some items are hidden.
export const listFilters = {
    // the overview's task lists: everything shown until the user hides it
    tasks: {
        storageKey: 'task-filters',
        title: 'Zobrazení úkolů',
        hidden: 'některé úkoly jsou skryté',
        options: [
            { key: 'showFinished', label: 'Zobrazit dokončené úkoly', default: true },
            { key: 'showBlocked', label: 'Zobrazit zamčené úkoly', hint: 'Zamčené úkoly čekají na dokončení předchozích úkolů.', default: true },
        ],
    },
    // a task's previous and next tasks (task detail): everything shown until the user hides it
    dependencies: {
        storageKey: 'dependency-filters',
        title: 'Zobrazení úkolů',
        hidden: 'některé úkoly jsou skryté',
        options: [
            { key: 'showBlocked', label: 'Zobrazit zamčené úkoly', hint: 'Zamčené úkoly čekají na dokončení předchozích úkolů.', default: true },
            { key: 'showInProgress', label: 'Zobrazit rozpracované úkoly', default: true },
            { key: 'showFinished', label: 'Zobrazit dokončené úkoly', default: true },
        ],
    },
    // the project's files (its Soubory tab)
    projectFiles: {
        storageKey: 'project-file-filters',
        title: 'Zobrazení souborů',
        hidden: 'některé soubory jsou skryté',
        options: [
            { key: 'showInput', label: 'Zobrazit vstupní soubory', default: true },
            { key: 'showOutput', label: 'Zobrazit výstupní soubory', default: true },
        ],
    },
    projects: {
        storageKey: 'project-filters',
        title: 'Zobrazení projektů',
        hidden: 'některé projekty jsou skryté',
        options: [
            { key: 'showFinished', label: 'Zobrazit dokončené projekty', default: false },
            { key: 'showOthers', label: 'Zobrazit projekty, kterých nejsem součástí', hint: 'Projekty, kde nejste vlastníkem ani členem.', default: false },
        ],
    },
    users: {
        storageKey: 'user-filters',
        title: 'Zobrazení pracovníků',
        hidden: 'někteří pracovníci jsou skrytí',
        options: [{ key: 'showDisabled', label: 'Zobrazit zakázané pracovníky', default: false }],
    },
};

const defaultsOf = (list) => Object.fromEntries(listFilters[list].options.map((option) => [option.key, option.default]));

const read = (list) => {
    try {
        const stored = JSON.parse(localStorage.getItem(listFilters[list].storageKey));
        return { ...defaultsOf(list), ...(stored && typeof stored === 'object' ? stored : {}) };
    } catch {
        return defaultsOf(list);
    }
};

const current = {};
const listeners = new Set();
const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};
const get = (list) => (current[list] ??= read(list));

const setListFilters = (list, changes) => {
    current[list] = { ...get(list), ...changes };
    try {
        localStorage.setItem(listFilters[list].storageKey, JSON.stringify(current[list]));
    } catch {
        // private mode / storage blocked: the choice still applies until the page is reloaded
    }
    listeners.forEach((listener) => listener());
};

// list: a key of listFilters ('tasks', 'dependencies', 'projects', 'users'). filters: { [option key]: boolean }; hiding: some option is off (something hidden)
export const useListFilters = (list) => {
    const filters = useSyncExternalStore(subscribe, () => get(list));
    return {
        filters,
        setFilters: (changes) => setListFilters(list, changes),
        hiding: listFilters[list].options.some((option) => !filters[option.key]),
    };
};
