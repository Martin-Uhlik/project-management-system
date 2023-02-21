import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@mui/material";
import React, {useEffect, useState} from "react";
import {MaterialRow} from "./rows/MaterialRow";
import axios from "axios";
import {getBackendAddress} from "../../../index";
import {getAuthHeader} from "../../../Auth";
import {handleAxiosError} from "../../../errorHandler";
import {useRecoilState, useRecoilValue} from "recoil";
import {notificationsAtom, tickAtom} from "../../../state/atoms";

export const MaterialTable = (props) => {

    const tick = useRecoilValue(tickAtom);
    const [notifications, setNotifications] = useRecoilState(notificationsAtom);

    const [materials, setMaterials] = useState(null);

    useEffect(() => {
        axios.get(getBackendAddress(`/auth/material`),
            getAuthHeader())
        .then((response) => {
            setMaterials(response.data.map(material => {
                let amount = 0;
                let reserved = 0;
                material.MaterialEvent.forEach((value) => {
                    if (value.EventType === "ADD") {
                        amount += value.Count;
                    } else if (value.EventType === "REMOVE") {
                        amount -= value.Count;
                    } else if (value.EventType === "RESERVATION") {
                        reserved += value.Count;
                    }
                });
                return {material: material, count: amount, reserved: reserved};
            }));
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
                        <TableCell align="right">Zarezervované</TableCell>
                        <TableCell align="right">Dostupné</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {materials?.map((mat) =>
                        <MaterialRow key={mat.material.ID} row={mat} taskID={props.taskID}/>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};