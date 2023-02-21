import {Checkbox, ListItemText, MenuItem, Select} from "@mui/material";
import React from "react";

export const UserMultiSelect = ({users, disabled, selectedUsers, setSelectedUsers}) => {
    const handleChange = (event) => {
        setSelectedUsers(event.target.value);
    };

    const MenuProps = {
        PaperProps: {
            style: {
                maxHeight: "10rem"
            }
        }
    };

    return (
        <div className="form-group">
            <label htmlFor="users">Členové:</label>
            <Select
                className="form-control"
                labelId="demo-multiple-checkbox-label"
                id="users"
                name="users"
                multiple
                value={selectedUsers}
                onChange={handleChange}
                size="small"
                renderValue={(selected) => selected.map((user) => {
                        const foundUser = users?.find(u => u.ID === user);
                        return `${foundUser?.FirstName} ${foundUser?.LastName}`;
                    }
                ).join(", ")}
                MenuProps={MenuProps}
                disabled={disabled}
            >
                {users.map((user) => (
                    <MenuItem key={user.ID} value={user.ID}>
                        <Checkbox checked={selectedUsers.includes(user.ID)}/>
                        <ListItemText primary={`${user.FirstName} ${user.LastName}`}/>
                    </MenuItem>
                ))}
            </Select>
        </div>
    );
};