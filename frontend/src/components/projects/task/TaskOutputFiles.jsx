import React, {useEffect, useState} from "react";
import {useLocation, useOutletContext, useParams} from "react-router-dom";
import {FileTable} from "../../utils/tables/FileTable";
import axios from "axios";
import {getBackendAddress} from "../../../index";
import {getAuthHeader} from "../../../Auth";
import {handleAxiosError} from "../../../errorHandler";
import {useRecoilState} from "recoil";
import {notificationsAtom, tickAtom} from "../../../state/atoms";
import Cookies from "js-cookie";
import moment from "moment/moment";

export const TaskOutputFiles = () => {
    const props = useOutletContext();
    const subTab = useLocation().pathname.split("/")[5];
    React.useEffect(() => {
        props(subTab);
    });

    const [notifications, setNotifications] = useRecoilState(notificationsAtom);
    const [tick, setTick] = useRecoilState(tickAtom);
    const projectID = useParams().project;
    const taskID = useParams().task;

    const [files, setFiles] = useState([]);

    useEffect(() => {
        axios.get(getBackendAddress(`/auth/projects/${projectID}/tasks/${taskID}/output-files`),
            getAuthHeader())
        .then((response) => {
            setFiles(response.data);
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick]);

    const handleUploadFile = (event) => {
        event.preventDefault();
        const selectedFile = event.target.inputFile.files[0];

        let data = new FormData();
        data.append("file", selectedFile);

        axios.post(getBackendAddress(`/auth/projects/${projectID}/tasks/${taskID}/output-files`),
            data,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${Cookies.get("auth")}`
                }
            })
        .then(function (response) {
            setTick(moment());
        })
        .catch((error) => {
            handleAxiosError(error, [notifications, setNotifications]);
        });
    };

    return (
        <div className="content-1-column h-100">
            <div className="content-box">
                <div className="content-box_content">
                    <div className="content-box_header">
                        <h1>Výstupní soubory</h1>
                    </div>
                    <hr/>
                    <form onSubmit={handleUploadFile} className="content-box_subheader w-100 mb-3">
                        <div className="w-100">
                            <input className="form-control" type="file" id="inputFile" name="inputFile"/>
                        </div>
                        <button className="btn btn-dark w-25" type="submit">Vložit</button>
                    </form>
                    <FileTable files={files}/>
                </div>
            </div>
        </div>
    );
};