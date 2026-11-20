import dayjs from '../../dayjs';
import axios from 'axios';
import { getBackendAddress } from '../../config';
import { getAuthHeader, getUserID } from '../../Auth';
import { handleAxiosError } from '../../errorHandler';
import { useAtom, useSetAtom } from 'jotai';
import { dialogAtom, notificationsAtom, tickAtom } from '../../state/atoms';
import { CheckIcon, PencilIcon, StyledStatus, StyledTableCell, StyledTableRow, TrashIcon, UndoIcon, taskStatus } from '../ui';

// A personal task: clicking it opens it for editing; on hover it offers edit, finish (or reopen) and delete
export const MyTask = ({ task }) => {
    const [notifications, setNotifications] = useAtom(notificationsAtom);
    const setTick = useSetAtom(tickAtom);
    const setDialog = useSetAtom(dialogAtom);
    const address = getBackendAddress(`/auth/${getUserID()}/personal-tasks/${task.ID}`);

    const send = (request) => {
        request
            .then(() => setTick(dayjs()))
            .catch((error) => {
                handleAxiosError(error, [notifications, setNotifications]);
            });
    };

    const update = (changes) => send(axios.patch(address, { task: changes }, getAuthHeader()));

    const handleEdit = () => {
        setDialog({ type: 'AddMyTask', data: { task, handleSubmit: update } });
    };

    const handleDelete = () => {
        setDialog({
            type: 'ConfirmDialog',
            data: {
                title: 'Smazat úkol',
                description: `Opravdu smazat úkol „${task.Name}“?`,
                handleSuccess: () => send(axios.delete(address, getAuthHeader())),
                handleCancel: () => {},
            },
        });
    };

    const status = taskStatus(task);
    const actions = [
        { label: 'Upravit', icon: <PencilIcon fontSize='small' />, onClick: handleEdit },
        task.Finished
            ? { label: 'Vrátit mezi nedokončené', icon: <UndoIcon fontSize='small' />, onClick: () => update({ Finished: false }) }
            : { label: 'Dokončit', icon: <CheckIcon fontSize='small' />, onClick: () => update({ Finished: true }), color: 'success' },
        { label: 'Smazat', icon: <TrashIcon fontSize='small' />, onClick: handleDelete, color: 'error' },
    ];
    return (
        <StyledTableRow status={status} onClick={handleEdit} actions={actions}>
            <StyledTableCell>
                <StyledStatus status={status}>{task.Name}</StyledStatus>
            </StyledTableCell>
            <StyledTableCell>{dayjs(task.FinishDate).format('L')}</StyledTableCell>
            <StyledTableCell>{task.Description}</StyledTableCell>
        </StyledTableRow>
    );
};
