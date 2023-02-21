import {Checkbox, TableCell, TableRow} from "@mui/material";
import {blue} from "@mui/material/colors";

export const UserRow = (props) => {
    const user = props.user;

    const checkerColor = {
        "&.Mui-checked": {
            color: blue[600]
        }
    };

    return (
        <TableRow hover onClick={() => {
            props.setSelectedUser(user);
        }}>
            <TableCell>
                {`${user.FirstName} ${user.LastName}`}
            </TableCell>
            <TableCell>{user.Position}</TableCell>
            <TableCell>
                <Checkbox disabled checked={user.WorkStartTime !== null} sx={checkerColor}/>
            </TableCell>
            <TableCell>
                <Checkbox disabled checked={user.Enabled} sx={checkerColor}/>
            </TableCell>
        </TableRow>
    );
};