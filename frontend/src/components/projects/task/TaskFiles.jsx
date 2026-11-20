import React, { useEffect, useState } from 'react';
import { useLocation, useOutletContext, useParams, useSearchParams } from 'react-router';
import { useAtom } from 'jotai';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import { notificationsAtom, tickAtom } from '../../../state/atoms';
import { FileTable } from '../../utils/tables/FileTable';
import axios from 'axios';
import { getBackendAddress } from '../../../config';
import { getAuthHeader } from '../../../Auth';
import dayjs from '../../../dayjs';
import { handleAxiosError } from '../../../errorHandler';
import { StyledDropzone } from '../../ui';
import { FileDetail } from './files/FileDetail';

// A task's input or output files (kind: 'input-files' or 'output-files'): the list, a drop area to upload more, and
// next to the list the detail (with a preview) of the file that was clicked, kept in the address as ?file=<name>
export const TaskFiles = ({ kind, title }) => {
    const props = useOutletContext();
    const subTab = useLocation().pathname.split('/')[5];
    React.useEffect(() => {
        props(subTab);
    });

    const [notifications, setNotifications] = useAtom(notificationsAtom);

    const [tick, setTick] = useAtom(tickAtom);
    const projectID = useParams().project;
    const taskID = useParams().task;
    const filesAddress = getBackendAddress(`/auth/projects/${projectID}/tasks/${taskID}/${kind}`);

    const [files, setFiles] = useState([]);

    useEffect(() => {
        axios
            .get(filesAddress, getAuthHeader())
            .then((response) => {
                setFiles(response.data);
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick, kind]);

    // the files dropped or chosen are uploaded one after another (the server takes one file per request)
    const [upload, setUpload] = useState(null);
    const handleUploadFiles = async (selected) => {
        const totalBytes = selected.reduce((sum, file) => sum + file.size, 0) || 1;
        let doneBytes = 0;
        setUpload({ progress: 0 });
        for (const file of selected) {
            const data = new FormData();
            data.append('file', file);
            try {
                await axios.post(filesAddress, data, {
                    ...getAuthHeader(),
                    onUploadProgress: (event) => {
                        setUpload({
                            progress: Math.min(100, ((doneBytes + (event.loaded ?? 0)) / totalBytes) * 100),
                        });
                    },
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
    const selectFile = (file) => setSearchParams(file && file.file !== selectedName ? { file: file.file } : {}, { replace: true });

    const list = (
        <div className='content-box' style={{ height: 'auto', flexBasis: 'auto', flexGrow: 0 }}>
            <div className='content-box_content' style={{ overflow: 'visible' }}>
                <div className='content-box_header'>
                    <h1>{title}</h1>
                </div>
                <Divider />
                <StyledDropzone onFiles={handleUploadFiles} busy={upload !== null} progress={upload?.progress} />
                <FileTable files={files} selected={selectedName} onSelect={selectFile} />
            </div>
        </div>
    );

    return (
        <Box
            sx={{
                display: 'grid',
                gap: 2,
                alignItems: 'start',
                mx: 'auto',
                width: selected ? 'min(100rem, 100%)' : 'min(50rem, 100%)',
                gridTemplateColumns: {
                    xs: 'minmax(0, 1fr)',
                    lg: selected ? 'minmax(0, 1fr) minmax(0, 1.25fr)' : 'minmax(0, 1fr)',
                },
            }}
        >
            {list}
            {selected ? (
                <Box className='content-box' sx={{ height: 'auto', p: 2, position: { lg: 'sticky' }, top: 0 }}>
                    <FileDetail
                        key={selected.file}
                        file={selected}
                        address={`${filesAddress}/${encodeURIComponent(selected.file)}`}
                        onClose={() => selectFile(null)}
                    />
                </Box>
            ) : null}
        </Box>
    );
};
