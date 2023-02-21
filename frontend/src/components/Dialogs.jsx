import {TimeDialog} from "./dialogs/TimeDialog";
import React from "react";
import {useRecoilValue} from "recoil";
import {dialogAtom} from "../state/atoms";
import {ConfirmDialog} from "./dialogs/ConfirmDialog";
import {AddMyTask} from "./dialogs/AddMyTask";
import {AddUser} from "./dialogs/AddUser";
import {AddMaterial} from "./dialogs/AddMaterial";
import {AddMaterialRequirement} from "./dialogs/AddMaterialRequirement";
import {AddMachineDialog} from "./dialogs/AddMachineDialog";
import {AddProject} from "./dialogs/AddProject";
import {AddTask} from "./dialogs/AddTask";
import {SelectDependency} from "./dialogs/SelectDependency";
import {RemoveDependency} from "./dialogs/RemoveDependency";
import {EditMaterial} from "./dialogs/EditMaterial";
import {EditMaterialRequirement} from "./dialogs/EditMaterialRequirement";


export const Dialogs = () => {
    const dialog = useRecoilValue(dialogAtom)
    const dialogs = {
        TimeDialog: <TimeDialog />,
        ConfirmDialog: <ConfirmDialog />,
        AddMyTask: <AddMyTask />,
        AddUser: <AddUser />,
        AddMaterial: <AddMaterial />,
        AddMaterialRequirement: <AddMaterialRequirement />,
        AddMachineDialog: <AddMachineDialog />,
        AddProject: <AddProject />,
        AddTask: <AddTask />,
        SelectDependency: <SelectDependency />,
        RemoveDependency: <RemoveDependency />,
        EditMaterial: <EditMaterial />,
        EditMaterialRequirement: <EditMaterialRequirement />
    }
    return (
        `${dialog?.type}` in dialogs ? dialogs[dialog?.type] : <div></div>
    )
}