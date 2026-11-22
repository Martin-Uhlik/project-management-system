import { StyledTable, useSearch } from '../../ui';
import { FileRow } from './rows/FileRow';
import type { FileEntry } from '../../../types';

// A task's files; onSelect(file) opens one in the detail panel, selected: the name of the open one
export const FileTable = ({
    files,
    selected,
    onSelect,
}: {
    files: FileEntry[] | null | undefined;
    selected?: string | null;
    onSelect?: (file: FileEntry) => void;
}) => {
    const search = useSearch(files, (file) => [file.file, file.UploadedBy ? `${file.UploadedBy.FirstName} ${file.UploadedBy.LastName}` : '']);
    return (
        <StyledTable columns={[{ label: 'Název' }, { label: 'Velikost', align: 'right' }, { label: 'Nahráno', align: 'right' }]} search={search}>
            {search.results.map((file) => (
                <FileRow key={file.file} row={file} selected={selected === file.file} onSelect={onSelect} />
            ))}
        </StyledTable>
    );
};
