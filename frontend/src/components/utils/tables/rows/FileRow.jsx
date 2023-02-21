import {TableCell, TableRow} from "@mui/material";
import moment from "moment";

export const FileRow = (props) => {
    const row = props.row;

    return (
        <TableRow hover>
            <TableCell>{row.file}</TableCell>
            <TableCell align="right">{row.size} MB</TableCell>
            <TableCell align="right">{moment(row.details).format("LLL")}</TableCell>
        </TableRow>
    );
};