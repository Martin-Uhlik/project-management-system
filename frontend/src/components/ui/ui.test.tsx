import { render, renderHook, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { vi } from 'vitest';
import TableCell from '@mui/material/TableCell';
import { StyledDropzone } from './StyledDropzone';
import { StyledSearchInput } from './StyledSearchInput';
import { StyledTable, StyledTableRow } from './StyledTable';
import { useSearch } from './useSearch';
import { fieldChecked, fieldValue } from '../../form';

const people = [
    { name: 'Jan Novák', position: 'Mistr výroby' },
    { name: 'Petra Dvořáková', position: 'Vedoucí konstrukce' },
    { name: 'Tomáš Svoboda', position: 'Konstruktér' },
];

test('useSearch ignores case and diacritics, and every word has to match', () => {
    const { result } = renderHook(() => useSearch(people, (person) => [person.name, person.position]));
    expect(result.current.results).toHaveLength(3);
    act(() => result.current.setQuery('KONSTRUK'));
    expect(result.current.results.map((person) => person.name)).toEqual(['Petra Dvořáková', 'Tomáš Svoboda']);
    act(() => result.current.setQuery('tomas konstrukter'));
    expect(result.current.results.map((person) => person.name)).toEqual(['Tomáš Svoboda']);
    act(() => result.current.setQuery('tomas mistr'));
    expect(result.current.results).toEqual([]);
});

const SearchTable = ({ onOpen }: { onOpen: (name: string) => void }) => {
    const search = useSearch(people, (person) => person.name);
    return (
        <StyledTable columns={[{ label: 'Jméno' }]} search={search}>
            {search.results.map((person) => (
                <StyledTableRow
                    key={person.name}
                    onClick={() => onOpen(person.name)}
                    actions={[{ label: `Smazat ${person.name}`, icon: 'x', onClick: () => onOpen(`delete ${person.name}`) }]}
                >
                    <TableCell>{person.name}</TableCell>
                </StyledTableRow>
            ))}
        </StyledTable>
    );
};

test('a searchable table filters its rows and says when nothing was found', async () => {
    const user = userEvent.setup();
    render(<SearchTable onOpen={() => {}} />);
    await user.type(screen.getByRole('searchbox', { name: 'Hledat…' }), 'novak');
    expect(screen.getByText('Jan Novák')).toBeInTheDocument();
    expect(screen.queryByText('Tomáš Svoboda')).not.toBeInTheDocument();

    await user.type(screen.getByRole('searchbox'), 'xyz');
    expect(screen.getByText('Nic nenalezeno')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Vymazat hledání' }));
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getAllByRole('row')).toHaveLength(4);
    expect(screen.queryByRole('button', { name: 'Vymazat hledání' })).not.toBeInTheDocument();
});

test('a row opens on click and with Enter, its actions do not open it', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(<SearchTable onOpen={onOpen} />);
    await user.click(screen.getByText('Jan Novák'));
    expect(onOpen).toHaveBeenLastCalledWith('Jan Novák');

    screen.getByText('Tomáš Svoboda').closest('tr')!.focus();
    await user.keyboard('{Enter}');
    expect(onOpen).toHaveBeenLastCalledWith('Tomáš Svoboda');

    onOpen.mockClear();
    await user.click(screen.getByRole('button', { name: 'Smazat Jan Novák' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith('delete Jan Novák');
});

test('the search field hands over the text, not the event', async () => {
    const user = userEvent.setup();
    const seen: string[] = [];
    const Field = () => {
        const [value, setValue] = useState('');
        return (
            <StyledSearchInput
                value={value}
                onChange={(text) => {
                    seen.push(text);
                    setValue(text);
                }}
            />
        );
    };
    render(<Field />);
    await user.type(screen.getByRole('searchbox'), 'ab');
    expect(seen).toEqual(['a', 'ab']);
});

test('fieldValue and fieldChecked read the submitted form by field name', async () => {
    const user = userEvent.setup();
    const submitted = vi.fn();
    render(
        <form
            onSubmit={(event) => {
                event.preventDefault();
                submitted(fieldValue(event, 'name'), fieldChecked(event, 'admin'), fieldValue(event, 'missing'));
            }}
        >
            <input name='name' aria-label='name' />
            <input name='admin' type='checkbox' aria-label='admin' />
            <button type='submit'>Uložit</button>
        </form>,
    );
    await user.type(screen.getByLabelText('name'), 'Linka 2');
    await user.click(screen.getByLabelText('admin'));
    await user.click(screen.getByRole('button', { name: 'Uložit' }));
    expect(submitted).toHaveBeenCalledWith('Linka 2', true, '');
});

test('a disabled drop area says why and takes no files', async () => {
    const user = userEvent.setup();
    const onFiles = vi.fn();
    render(<StyledDropzone onFiles={onFiles} disabled='V ukázkové verzi nelze nahrávat soubory.' />);
    const area = screen.getByRole('button', { name: /V ukázkové verzi nelze nahrávat soubory/ });
    expect(area).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('V ukázkové verzi nelze nahrávat soubory.')).toBeInTheDocument();
    await user.upload(area.querySelector('input')!, new File(['x'], 'a.txt'));
    expect(onFiles).not.toHaveBeenCalled();
});
