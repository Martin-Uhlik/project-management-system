import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@mui/material";
import React, {useEffect, useState} from "react";
import axios from "axios";
import {getBackendAddress} from "../../../index";
import {getAuthHeader} from "../../../Auth";
import {handleAxiosError} from "../../../errorHandler";
import {useRecoilState, useRecoilValue} from "recoil";
import {notificationsAtom, tickAtom} from "../../../state/atoms";
import {useParams} from "react-router-dom";
import {ReservedMaterialRow} from "./rows/ReservedMaterialRow";

export const TaskMaterialTable = () => {

    const tick = useRecoilValue(tickAtom);
    const [notifications, setNotifications] = useRecoilState(notificationsAtom);

    const [materials, setMaterials] = useState(null);

    const taskID = useParams().task;

    useEffect(() => {
        axios.get(getBackendAddress(`/auth/tasks/${taskID}/material`),
            getAuthHeader())
        .then((response) => {
            setMaterials(response.data);
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
                        <TableCell align="right">Počet</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {materials?.map((mat) =>
                        <ReservedMaterialRow key={mat.ID} row={mat}/>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};