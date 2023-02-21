import React from "react";
import {Checkbox, TableCell, TableRow} from "@mui/material";
import {blue} from "@mui/material/colors";
import moment from "moment";

export const ProjectRow = (props) => {
    const project = props.project;

    const checkerColor = {
        "&.Mui-checked": {
            color: blue[600]
        }
    };

    return (
        <TableRow hover onClick={() => {
            props.setSelectedProject(project.ID);
        }}>
            <TableCell>{project.Name}</TableCell>
            <TableCell>{project.Customer}</TableCell>
            <TableCell>{moment(project.FinishDate).format("L")}</TableCell>
            <TableCell>
                <Checkbox disabled checked={project.Finished} sx={checkerColor}/>
            </TableCell>
        </TableRow>
    );
};