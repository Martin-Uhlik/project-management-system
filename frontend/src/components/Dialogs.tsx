import type React from 'react';
import { TimeDialog } from './dialogs/TimeDialog';
import { StartTimer } from './dialogs/StartTimer';
import { useAtomValue } from 'jotai';
import { dialogAtom } from '../state/atoms';
import { ConfirmDialog } from './dialogs/ConfirmDialog';
import { AddMyTask } from './dialogs/AddMyTask';
import { AddUser } from './dialogs/AddUser';
import { AddMaterial } from './dialogs/AddMaterial';
import { AddMaterialRequirement } from './dialogs/AddMaterialRequirement';
import { AddMachineDialog } from './dialogs/AddMachineDialog';
import { AddProject } from './dialogs/AddProject';
import { AddTask } from './dialogs/AddTask';
import { SelectDependency } from './dialogs/SelectDependency';
import { EditMaterial } from './dialogs/EditMaterial';
import { EditMaterialRequirement } from './dialogs/EditMaterialRequirement';
import { ListFilters } from './dialogs/ListFilters';

export const Dialogs = () => {
    const dialog = useAtomValue(dialogAtom);
    const dialogs: Record<string, React.JSX.Element> = {
        TimeDialog: <TimeDialog />,
        StartTimer: <StartTimer />,
        ConfirmDialog: <ConfirmDialog />,
        AddMyTask: <AddMyTask />,
        AddUser: <AddUser />,
        AddMaterial: <AddMaterial />,
        AddMaterialRequirement: <AddMaterialRequirement />,
        AddMachineDialog: <AddMachineDialog />,
        AddProject: <AddProject />,
        AddTask: <AddTask />,
        SelectDependency: <SelectDependency />,
        EditMaterial: <EditMaterial />,
        EditMaterialRequirement: <EditMaterialRequirement />,
        ListFilters: <ListFilters />,
    };
    return dialog && dialog.type in dialogs ? dialogs[dialog.type] : <div></div>;
};
