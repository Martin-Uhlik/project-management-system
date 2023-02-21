import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@mui/material";
import React, {useEffect, useState} from "react";
import {MaterialRequirementRow} from "./rows/MaterialRequirementRow";
import {useRecoilState, useRecoilValue} from "recoil";
import {notificationsAtom, tickAtom} from "../../../state/atoms";
import axios from "axios";
import {getBackendAddress} from "../../../index";
import {getAuthHeader} from "../../../Auth";
import {handleAxiosError} from "../../../errorHandler";

export const MaterialRequirementTable = ({taskID}) => {

    const tick = useRecoilValue(tickAtom);
    const [notifications, setNotifications] = useRecoilState(notificationsAtom);

    const [materialRequests, setMaterialRequests] = useState(null);

    useEffect(() => {
        axios.get(getBackendAddress(`/auth/materialRequirements`),
            getAuthHeader())
        .then((response) => {
            if (taskID) {
                setMaterialRequests(response.data.filter(requirement => requirement.TargetTaskID === +taskID));
            } else {
                setMaterialRequests(response.data);
            }
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick]);

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Název</TableCell>
                        <TableCell align="right">Cena celkem</TableCell>
                        <TableCell align="right">Datum potřeby</TableCell>
                        <TableCell align="right">Autor</TableCell>
                        <TableCell align="right">Schválil</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {materialRequests?.map((row) =>
                        <MaterialRequirementRow key={row.ID} row={row}/>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};