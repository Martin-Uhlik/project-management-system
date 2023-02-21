import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import {FileRow} from "./rows/FileRow";


export const FileTable = (props) => {

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Název</TableCell>
                        <TableCell align="right">Velikost</TableCell>
                        <TableCell align="right">Datum vytvoření</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {props.files.map((mat) =>
                        <FileRow key={mat.file} row={mat}/>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};
