import React from "react";
import {TableCell, TableRow} from "@mui/material";
import {useSetRecoilState} from "recoil";
import {dialogAtom} from "../../../../state/atoms";

export const MaterialRow = (props) => {
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
            <TableCell>{row.material.Name}</TableCell>
            <TableCell align="right">{row.count}</TableCell>
            <TableCell align="right">{row.reserved}</TableCell>
            <TableCell align="right">{row.count - row.reserved}</TableCell>
        </TableRow>
    );
};