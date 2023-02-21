import React from "react";
import {TableCell, TableRow} from "@mui/material";
import moment from "moment";
import {useSetRecoilState} from "recoil";
import {dialogAtom} from "../../../../state/atoms";

export const MaterialRequirementRow = (props) => {
    const requirement = props.row;
    const setDialog = useSetRecoilState(dialogAtom);

    const handleEditMaterial = () => {
        setDialog({
            type: "EditMaterialRequirement",
            data: {
                material: requirement,
                handleSubmit: () => {
                },
                handleCancel: () => {
                }
            }
        });
    };

    return (
        <TableRow hover onClick={handleEditMaterial}>
            <TableCell>{requirement.Name}</TableCell>
            <TableCell align="right">{requirement.Price * requirement.Count}</TableCell>
            <TableCell align="right">{moment(requirement.NeededDate).format("L")}</TableCell>
            <TableCell
                align="right">{`${requirement.TargetUser.FirstName} ${requirement.TargetUser.LastName}`}</TableCell>
            <TableCell
                align="right">{`${requirement?.AcceptedBy?.FirstName || ""} ${requirement?.AcceptedBy?.LastName || ""}`}</TableCell>
        </TableRow>
    );
};