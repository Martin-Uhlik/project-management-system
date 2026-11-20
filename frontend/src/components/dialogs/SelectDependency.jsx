import { useEffect, useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { dialogAtom, notificationsAtom, tickAtom } from '../../state/atoms';
import axios from 'axios';
import { getBackendAddress } from '../../config';
import { getAuthHeader } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import { useParams } from 'react-router';
import { ButtonRow, FormStack, StyledButton, StyledDialog, StyledSelect } from '../ui';

export const SelectDependency = () => {
    const [dialog, setDialog] = useAtom(dialogAtom);
    const [nodes, setNodes] = useState([]);
    const [selected, setSelected] = useState('');

    const projectID = useParams().project;

    const tick = useAtomValue(tickAtom);
    const [notifications, setNotifications] = useAtom(notificationsAtom);

    const handleCancel = (event) => {
        event.preventDefault();
        dialog.data.handleCancel();
        setDialog(null);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        dialog.data.handleSubmit(selected, dialog.data.dependencyType);
        setDialog(null);
    };

    useEffect(() => {
        axios
            .get(getBackendAddress(`/auth/projects/${projectID}/tasks`), getAuthHeader())
            .then((response) => {
                setNodes(response.data.tasks);
                setSelected((current) => current || (response.data.tasks[0]?.ID ?? ''));
            })
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick]);

    return (
        <StyledDialog title='Přidat závislost' onClose={handleCancel}>
            <FormStack component='form' gap={4} onSubmit={handleSubmit}>
                <StyledSelect
                    id='dependency'
                    label='Úkol'
                    value={nodes.length ? selected : ''}
                    onChange={(event) => setSelected(event.target.value)}
                    options={nodes.map((node) => ({ value: node.ID, label: node.Name }))}
                />
                <ButtonRow>
                    <StyledButton color='error' onClick={handleCancel}>
                        Zrušit
                    </StyledButton>
                    <StyledButton color='success' type='submit' disabled={!selected}>
                        Ok
                    </StyledButton>
                </ButtonRow>
            </FormStack>
        </StyledDialog>
    );
};
