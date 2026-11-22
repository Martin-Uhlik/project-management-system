import { useState } from 'react';
import { useAtom } from 'jotai';
import { dialogAtom } from '../../state/atoms';
import { useApi } from '../../state/query';
import { useParams } from 'react-router';
import { ButtonRow, FormStack, StyledButton, StyledDialog, StyledSelect } from '../ui';

const noNodes = [];

export const SelectDependency = () => {
    const [dialog, setDialog] = useAtom(dialogAtom);
    const [chosen, setSelected] = useState('');

    const projectID = useParams().project;

    // the project's tasks, loaded already for its graph
    const { data } = useApi(`/auth/projects/${projectID}/tasks`, { topics: [`project:${projectID}`] });
    const nodes = data?.tasks ?? noNodes;
    // the task picked, else the first one
    const selected = chosen || (nodes[0]?.ID ?? '');

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
