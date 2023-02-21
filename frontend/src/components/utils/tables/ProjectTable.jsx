import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@mui/material";
import {ProjectRow} from "./rows/ProjectRow";
import React from "react";

export const ProjectTable = ({projects, setSelectedProject}) => {
    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Název</TableCell>
                        <TableCell>Zákazník</TableCell>
                        <TableCell>Dokončení</TableCell>
                        <TableCell>Dokončeno</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {projects.map((project) =>
                        <ProjectRow key={project.ID} project={project} setSelectedProject={setSelectedProject} />
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};