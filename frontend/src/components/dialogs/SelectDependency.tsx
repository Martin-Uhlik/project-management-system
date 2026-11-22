import { useState } from 'react';
import { useDialog } from '../../state/atoms';
import { useApi } from '../../state/query';
import { useParams } from 'react-router';
import { ButtonRow, FormStack, StyledButton, StyledDialog, StyledSelect } from '../ui';
import type { SyntheticEvent } from 'react';
import type { Task } from '../../types';

interface SelectDependencyData {
    dependencyType: string;
    handleCancel: () => void;
    handleSubmit: (taskID: number, dependencyType: string) => void;
}

const noNodes: Task[] = [];

export const SelectDependency = () => {
    const [dialog, setDialog] = useDialog<SelectDependencyData>();
    const [chosen, setSelected] = useState<number | ''>('');

    const projectID = useParams().project;

    // the project's tasks, loaded already for its graph
    const { data } = useApi<{ tasks: Task[] }>(`/auth/projects/${projectID}/tasks`, { topics: [`project:${projectID}`] });
    const nodes = data?.tasks ?? noNodes;
    // the task picked, else the first one
    const selected = chosen || (nodes[0]?.ID ?? '');

    const handleCancel = (event: SyntheticEvent) => {
        event.preventDefault();
        dialog.data.handleCancel();
        setDialog(null);
    };

    const handleSubmit = (event: SyntheticEvent) => {
        event.preventDefault();
        dialog.data.handleSubmit(selected, dialog.data.dependencyType);
        setDialog(null);
    };

    return (
        <StyledDialog title='Přidat závislost' onClose={handleCancel}>
            <FormStack component='form' gap={4} onSubmit={handleSubmit}>
                <StyledSelect
                    id='dependency'
                    label='Úkol'
                    value={nodes.length ? selected : ''}
                    onChange={(event) => setSelected(Number(event.target.value))}
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
