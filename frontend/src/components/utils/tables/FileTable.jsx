import { StyledTable, useSearch } from '../../ui';
import { FileRow } from './rows/FileRow';

export const FileTable = (props) => {
    const search = useSearch(props.files, (file) => file.file);
    return (
        <StyledTable columns={[{ label: 'Název' }, { label: 'Velikost', align: 'right' }, { label: 'Datum vytvoření', align: 'right' }]} search={search}>
            {search.results.map((mat) => (
                <FileRow key={mat.file} row={mat} />
            ))}
        </StyledTable>
    );
};
