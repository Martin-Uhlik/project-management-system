import {useNavigate} from "react-router-dom";
import {useSetRecoilState} from "recoil";
import {selectedTabAtom} from "../../state/atoms";
import React, {useState} from "react";
import {GraphEvents} from "./project/GraphEvents";
import {ControlsContainer, FullScreenControl, SearchControl, SigmaContainer, ZoomControl} from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";
import {LoadGraph} from "./project/LoadGraph";
import {RestrictedComponent} from "../utils/RestrictedComponent";

export const Project = () => {
    const setTab = useSetRecoilState(selectedTabAtom);
    React.useEffect(() => {
        setTab("Projekty");
    });

    const [selectedNode, setSelectedNode] = React.useState(null);
    const selectNode = (node) => {
        setSelectedNode(node);
    };
    const navigate = useNavigate();
    const handleNavigate = () => {
        navigate(selectedNode);
    };

    const [addNode, setAddNode] = useState(false);

    return (
        <div className="content-wrap_inner">
            <div className="content-box">
                <div className="content-box_content">
                    <h1>Projekt 001</h1>
                    <SigmaContainer>
                        <ControlsContainer position="top-left">
                            <FullScreenControl/>
                            <ZoomControl/>
                        </ControlsContainer>
                        <ControlsContainer position="top-right">
                            <SearchControl/>
                        </ControlsContainer>
                        <RestrictedComponent types={["ADMIN", "MANAGER"]}>
                            <ControlsContainer position="bottom-left">
                                {addNode ?
                                    <button className="btn btn-danger" onClick={() => {
                                        setAddNode(!addNode);
                                    }}>Zrušit</button>
                                    :
                                    <button className="btn btn-dark" onClick={() => {
                                        setAddNode(!addNode);
                                    }}>Přidat úkol</button>
                                }
                            </ControlsContainer>
                        </RestrictedComponent>
                        {selectedNode !== null ? (
                            <ControlsContainer className="d-flex flex-column" position="bottom-right">
                                <button className="btn btn-dark" onClick={handleNavigate}>Přejít na úkol</button>
                            </ControlsContainer>
                        ) : null}
                        <LoadGraph/>
                        <GraphEvents selectNode={selectNode} addNode={{addNode, setAddNode}}/>
                    </SigmaContainer>
                </div>
            </div>
        </div>

    );
};