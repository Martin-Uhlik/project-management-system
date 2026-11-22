import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAtom, useSetAtom } from 'jotai';
import axios from 'axios';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { dialogAtom, notificationsAtom, tickAtom } from '../../state/atoms';
import { useApi } from '../../state/query';
import { demoUploadsOff, useDemoMode } from '../../state/demo';
import { getBackendAddress } from '../../config';
import { getAuthHeader } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import dayjs from '../../dayjs';
import { StyledDropzone, StyledTable, StyledTableCell, StyledTableRow, TrashIcon, fileType, formatBytes, useSearch } from '../ui';
import Box from '@mui/material/Box';
import { FileDetail } from '../projects/task/files/FileDetail';
import { FilesLayout } from '../projects/task/files/FilesLayout';
import type { FileEntry, MachineDetail, PublicUser } from '../../types';

const noFiles: FileEntry[] = [];
const fullName = (user: PublicUser | null | undefined) => (user ? `${user.FirstName} ${user.LastName}` : '');

// A machine's "Soubory" tab (documentation, manuals, certificates...): the list with the preview of the open file next
// to it (?file=<name>); the people who may edit the machine upload files by dropping them and delete them
export const MachineFiles = ({ machine, canEdit }: { machine: MachineDetail; canEdit: boolean }) => {
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const setTick = useSetAtom(tickAtom);
    const demoMode = useDemoMode();
    const setDialog = useSetAtom(dialogAtom);
    const filesPath = `/auth/machines/${machine.ID}/files`;
    const filesAddress = getBackendAddress(filesPath);
    // reloaded when someone changes this data (live updates) or after a change made here
    const { data: files = noFiles } = useApi<FileEntry[]>(filesPath, { topics: ['machines'] });
    const search = useSearch(files, (file) => [file.file, fullName(file.UploadedBy)]);

    // the files dropped or chosen are uploaded one after another (the server takes one file per request)
    const [upload, setUpload] = useState<{ progress: number } | null>(null);
    const handleUploadFiles = async (selected: File[]) => {
        const totalBytes = selected.reduce((sum, file) => sum + file.size, 0) || 1;
        let doneBytes = 0;
        setUpload({ progress: 0 });
        for (const file of selected) {
            const data = new FormData();
            data.append('file', file);
            try {
                await axios.post(filesAddress, data, {
                    ...getAuthHeader(),
                    onUploadProgress: (event) => setUpload({ progress: Math.min(100, ((doneBytes + (event.loaded ?? 0)) / totalBytes) * 100) }),
                });
            } catch (error) {
                handleAxiosError(error, [notifications, setNotifications]);
            }
            doneBytes += file.size;
        }
        setUpload(null);
        setTick(dayjs());
    };

    const [searchParams, setSearchParams] = useSearchParams();
    const selectedName = searchParams.get('file');
    const selected = files.find((file) => file.file === selectedName) ?? null;
    const selectFile = (file: FileEntry | null) => {
        const next = new URLSearchParams(searchParams);
        if (file && file.file !== selectedName) next.set('file', file.file);
        else next.delete('file');
        setSearchParams(next, { replace: true });
    };

    const remove = (file: FileEntry) =>
        setDialog({
            type: 'ConfirmDialog',
            data: {
                title: 'Odstranit soubor',
                description: `Opravdu chcete odstranit soubor „${file.file}“?`,
                handleCancel: () => {},
                handleSuccess: () =>
                    axios
                        .delete(`${filesAddress}/${encodeURIComponent(file.file)}`, getAuthHeader())
                        .then(() => {
                            if (file.file === selectedName) selectFile(null);
                            setTick(dayjs());
                        })
                        .catch((error) => handleAxiosError(error, [notifications, setNotifications])),
            },
        });

    return (
        <FilesLayout
            list={
                <>
                    <div className='content-box_header'>
                        <h1>Soubory stroje</h1>
                    </div>
                    <Divider />
                    {canEdit ? (
                        <StyledDropzone
                            onFiles={handleUploadFiles}
                            busy={upload !== null}
                            progress={upload?.progress}
                            disabled={demoMode ? demoUploadsOff : undefined}
                        />
                    ) : null}
                    <StyledTable search={search} columns={[{ label: 'Název' }, { label: 'Velikost', align: 'right' }, { label: 'Nahráno', align: 'right' }]}>
                        {search.results.map((file) => {
                            const Icon = fileType(file.file).icon;
                            return (
                                <StyledTableRow
                                    key={file.file}
                                    selected={file.file === selectedName}
                                    onClick={() => selectFile(file)}
                                    actions={canEdit ? [{ label: 'Odstranit', icon: <TrashIcon />, onClick: () => remove(file) }] : undefined}
                                >
                                    <StyledTableCell>
                                        <Box component='span' sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, wordBreak: 'break-word' }}>
                                            <Icon fontSize='small' sx={{ color: 'text.secondary', flexShrink: 0 }} />
                                            {file.file}
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
                        <Typography sx={{ color: 'text.secondary' }}>
                            Stroj zatím nemá žádné soubory{canEdit ? '. Přetáhněte sem dokumentaci, návody nebo revize.' : '.'}
                        </Typography>
                    ) : null}
                </>
            }
            detail={
                selected ? (
                    <FileDetail
                        key={selected.file}
                        file={selected}
                        address={`${filesAddress}/${encodeURIComponent(selected.file)}`}
                        onClose={() => selectFile(null)}
                    />
                ) : null
            }
        />
    );
};
