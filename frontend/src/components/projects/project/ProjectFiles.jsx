import { useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { getBackendAddress } from '../../../config';
import dayjs from '../../../dayjs';
import { useListFilters } from '../../../state/listFilters';
import { ListFiltersButton } from '../../utils/ListFiltersButton';
import { FileDetail } from '../task/files/FileDetail';
import { FilesLayout } from '../task/files/FilesLayout';
import { StyledBoxHeader, StyledChip, StyledTable, StyledTableCell, StyledTableRow, fileType, formatBytes, useSearch } from '../../ui';

const kindLabels = { input: 'Vstupní', output: 'Výstupní' };
const fileKey = (file) => `${file.Kind}:${file.Task.ID}:${file.file}`;

// All files of the project's tasks (files: from GET /auth/projects/:id/files), with whether each is an input or an
// output file and the task it belongs to. The gear hides input or output files; a row opens the file's detail (with a
// preview) next to the list, kept in the address as ?file=<kind>:<task>:<name>.
export const ProjectFiles = ({ files }) => {
    const projectID = useParams().project;
    const { filters } = useListFilters('projectFiles');
    const shown = useMemo(() => files.filter((file) => (file.Kind === 'input' ? filters.showInput : filters.showOutput)), [files, filters]);
    const search = useSearch(shown, (file) => [
        file.file,
        file.Task.Name,
        kindLabels[file.Kind],
        file.UploadedBy ? `${file.UploadedBy.FirstName} ${file.UploadedBy.LastName}` : '',
    ]);

    const [searchParams, setSearchParams] = useSearchParams();
    const selectedKey = searchParams.get('file');
    const selected = files.find((file) => fileKey(file) === selectedKey) ?? null;
    const selectFile = (file) => {
        const next = new URLSearchParams(searchParams);
        if (file && fileKey(file) !== selectedKey) next.set('file', fileKey(file));
        else next.delete('file');
        setSearchParams(next, { replace: true });
    };

    return (
        <FilesLayout
            list={
                <>
                    <StyledBoxHeader title='Soubory projektu' settings={<ListFiltersButton list='projectFiles' />} />
                    <StyledTable
                        search={search}
                        columns={[
                            { label: 'Název' },
                            { label: 'Typ' },
                            { label: 'Úkol' },
                            { label: 'Velikost', align: 'right' },
                            { label: 'Nahráno', align: 'right' },
                        ]}
                    >
                        {search.results.map((file) => {
                            const Icon = fileType(file.file).icon;
                            const key = fileKey(file);
                            return (
                                <StyledTableRow key={key} selected={key === selectedKey} onClick={() => selectFile(file)}>
                                    {/* a long name wraps by words, so the column keeps room for it */}
                                    <StyledTableCell sx={{ minWidth: '12rem' }}>
                                        <Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, overflowWrap: 'anywhere' }}>
                                            <Icon fontSize='small' sx={{ color: 'text.secondary', flexShrink: 0 }} />
                                            {file.file}
                                        </Box>
                                    </StyledTableCell>
                                    <StyledTableCell sx={{ whiteSpace: 'nowrap' }}>
                                        <StyledChip label={kindLabels[file.Kind]} color={file.Kind === 'input' ? 'info' : 'success'} variant='outlined' />
                                    </StyledTableCell>
                                    <StyledTableCell>
                                        <Box
                                            component={Link}
                                            to={`/auth/projects/${projectID}/${file.Task.ID}/${file.Kind}-files?file=${encodeURIComponent(file.file)}`}
                                            onClick={(event) => event.stopPropagation()}
                                            sx={{ color: 'inherit' }}
                                        >
                                            {file.Task.Name}
                                        </Box>
                                    </StyledTableCell>
                                    <StyledTableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                                        {formatBytes(file.Bytes)}
                                    </StyledTableCell>
                                    <StyledTableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                                        {dayjs(file.details).format('L LT')}
                                    </StyledTableCell>
                                </StyledTableRow>
                            );
                        })}
                    </StyledTable>
                    {files.length === 0 ? (
                        <Typography sx={{ color: 'text.secondary' }}>Úkoly projektu zatím nemají žádné soubory.</Typography>
                    ) : shown.length === 0 ? (
                        <Typography sx={{ color: 'text.secondary' }}>Všechny soubory jsou skryté (ozubené kolo u nadpisu).</Typography>
                    ) : null}
                </>
            }
            detail={
                selected ? (
                    <FileDetail
                        key={selectedKey}
                        file={selected}
                        address={getBackendAddress(
                            `/auth/projects/${projectID}/tasks/${selected.Task.ID}/${selected.Kind}-files/${encodeURIComponent(selected.file)}`,
                        )}
                        onClose={() => selectFile(null)}
                    />
                ) : null
            }
        />
    );
};
