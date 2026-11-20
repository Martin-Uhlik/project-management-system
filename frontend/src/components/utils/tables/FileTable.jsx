import { StyledTable } from '../../ui';
import { FileRow } from './rows/FileRow';

export const FileTable = (props) => {
    return (
        <StyledTable columns={[{ label: 'Název' }, { label: 'Velikost', align: 'right' }, { label: 'Datum vytvoření', align: 'right' }]}>
            {props.files.map((mat) => (
                <FileRow key={mat.file} row={mat} />
            ))}
        </StyledTable>
    );
};
