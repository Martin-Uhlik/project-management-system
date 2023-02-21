import {useNavigate} from "react-router-dom";
import moment from "moment";


export const AssignedTask = (props) => {
    const navigate = useNavigate();
    const owner = props.task.Owner;
    return(
        <tr className="task p-3" onClick={() =>
            navigate(`/auth/projects/${props.task.ProjectID.toString()}/${props.task.ID.toString()}`)
        }>
            <td>
                {props.task.Name}
            </td>
            <td>
                {props.task.Project.Name}
            </td>
            <td>
                {`${owner.FirstName} ${owner.LastName}`}
            </td>
            <td>
                {moment(props.task.FinishDate).format("L")}
            </td>
        </tr>
    )
}