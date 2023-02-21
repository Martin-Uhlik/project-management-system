import React from "react";
import {TableCell, TableRow} from "@mui/material";
import {useSetRecoilState} from "recoil";
import {dialogAtom} from "../../../../state/atoms";

export const ReservedMaterialRow = (props) => {
    const row = props.row;
    const setDialog = useSetRecoilState(dialogAtom);

    const handleEditMaterial = () => {
        setDialog({
            type: "EditMaterial",
            data: {
                material: props.row.material,
                taskID: props.taskID,
                handleSubmit: () => {
                },
                handleCancel: () => {
                }
            }
        });
    };

    return (
        <TableRow hover onClick={handleEditMaterial}>
            <TableCell>{row.Material.Name}</TableCell>
            <TableCell align="right">{row.Count}</TableCell>
        </TableRow>
    );
};