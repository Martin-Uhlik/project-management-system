import { formatMinutes } from './formatMinutes';
import { fileExtension, fileType, formatBytes } from './fileTypes';
import { projectStatus, taskStatus, userStatus } from './taskStatus';

test('formatMinutes writes hours and minutes', () => {
    expect(formatMinutes(135)).toBe('2 h 15 min');
    expect(formatMinutes(120)).toBe('2 h');
    expect(formatMinutes(45)).toBe('45 min');
    expect(formatMinutes(0)).toBe('0 h');
    expect(formatMinutes(null)).toBe('0 h');
    expect(formatMinutes(29.6)).toBe('30 min');
    expect(formatMinutes(-90)).toBe('−1 h 30 min');
});

test('formatBytes picks the unit and writes Czech decimals', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1536)).toBe('1,5 kB');
    expect(formatBytes(150 * 1024)).toBe('150 kB');
    expect(formatBytes(4.25 * 1024 * 1024)).toMatch(/^4,[23] MB$/);
    expect(formatBytes(null)).toBe('');
});

test('fileType knows the kind and preview of a file by its extension', () => {
    expect(fileExtension('Výkres.PDF')).toBe('pdf');
    expect(fileExtension('.gitignore')).toBe('');
    expect(fileType('drawing.pdf').preview).toBe('pdf');
    expect(fileType('table.xlsx').preview).toBe('excel');
    expect(fileType('part.stl').preview).toBe('model');
    expect(fileType('assembly.iam').preview).toBeNull();
    expect(fileType('data.xyz')).toMatchObject({ kind: 'other', label: 'Soubor XYZ', preview: null });
    expect(fileType('README').label).toBe('Soubor');
});

test('taskStatus: finished, then blocked, then in progress, else todo', () => {
    expect(taskStatus({ Finished: true, _count: { Successors: 2 } })).toBe('finished');
    expect(taskStatus({ Finished: false, _count: { Successors: 1, WorkingUsers: 1 } })).toBe('blocked');
    expect(taskStatus({ Finished: false, _count: { WorkingUsers: 1 } })).toBe('inProgress');
    expect(taskStatus({ Finished: false, _count: { UserTaskTime: 3 } })).toBe('inProgress');
    expect(taskStatus({ Finished: false })).toBe('todo');
});

test('projectStatus and userStatus', () => {
    expect(projectStatus({ Finished: true, WorkingSince: '2026-11-22T08:00:00Z' })).toBe('finished');
    expect(projectStatus({ Finished: false, WorkingSince: '2026-11-22T08:00:00Z' })).toBe('inProgress');
    expect(projectStatus({ Finished: false, WorkingSince: null })).toBe('todo');
    expect(userStatus({ Enabled: false, WorkStartTime: '2026-11-22T08:00:00Z' })).toBe('disabled');
    expect(userStatus({ Enabled: true, WorkStartTime: '2026-11-22T08:00:00Z' })).toBe('working');
    expect(userStatus({ Enabled: true, WorkStartTime: null })).toBeNull();
});
