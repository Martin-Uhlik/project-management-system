import React, { useEffect, useState } from 'react';
import { useLocation, useOutletContext, useParams } from 'react-router';
import { useAtom } from 'jotai';
import Divider from '@mui/material/Divider';
import { notificationsAtom, tickAtom } from '../../../state/atoms';
import { FileTable } from '../../utils/tables/FileTable';
import axios from 'axios';
import { getBackendAddress } from '../../../config';
import { getAuthHeader } from '../../../Auth';
import dayjs from '../../../dayjs';
import { handleAxiosError } from '../../../errorHandler';
import { ButtonRow, StyledButton, StyledFileInput } from '../../ui';

// A task's input or output files (kind: 'input-files' or 'output-files'): the list and an upload form
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

    const handleUploadFile = (event) => {
        event.preventDefault();
        const selectedFile = event.target.inputFile.files[0];
        if (!selectedFile) return;

        let data = new FormData();
        data.append('file', selectedFile);

        axios
            .post(filesAddress, data, getAuthHeader())
            .then(() => {
                event.target.reset();
                setTick(dayjs());
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    return (
        <div className='content-1-column'>
            <div className='content-box'>
                <div className='content-box_content'>
                    <div className='content-box_header'>
                        <h1>{title}</h1>
                    </div>
                    <Divider />
                    <ButtonRow component='form' justify='flex-start' wrap={false} onSubmit={handleUploadFile}>
                        <StyledFileInput key={tick?.valueOf()} name='inputFile' />
                        <StyledButton type='submit'>Vložit</StyledButton>
                    </ButtonRow>
                    <FileTable files={files} />
                </div>
            </div>
        </div>
    );
};
