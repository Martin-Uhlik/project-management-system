import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@mui/material";
import {UserRow} from "./rows/UserRow";
import React from "react";

export const UserTable = ({users: users, setSelectedUser: setSelectedUser}) => {
    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Jméno</TableCell>
                        <TableCell>Pozice</TableCell>
                        <TableCell>Pracuje</TableCell>
                        <TableCell>Povoleno</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.map( (user) =>
                        <UserRow key={user.ID} user={user} setSelectedUser={setSelectedUser}/>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};