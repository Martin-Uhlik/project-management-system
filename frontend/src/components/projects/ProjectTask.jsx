import {useSetRecoilState} from "recoil";
import {selectedTabAtom} from "../../state/atoms";
import React from "react";
import {Link, Outlet} from "react-router-dom";

export const ProjectTask = () => {
    const setTab = useSetRecoilState(selectedTabAtom)
    React.useEffect(() => {
        setTab("Projekty")
    })
    const [selectedSubTab, setSelectedSubTab] = React.useState(null)
    const [machines, setMachines] = React.useState([
        {name: "Přehled", address: "overview"},
        {name: "Vstupní soubory", address: "input-files"},
        {name: "Výstupní soubory", address: "output-files"},
        {name: "Stroje", address: "machines"},
        {name: "Materiál", address: "material"},
    ])

    return(
        <>
            <div className="sub-tabs">
                <Link className="btn sub-tabs_button btn-primary" to="../.." relative="path">Zpět</Link>
                {machines.map((machine) => {

                        return<Link key={machine.address} className={"btn sub-tabs_button " + (selectedSubTab === machine.address ? "btn-light" : "btn-outline-light")} to={machine.address}>{machine.name}</Link>
                    }
                )}
            </div>
            <div className="content-wrap_inner">
                <Outlet context={setSelectedSubTab}/>
            </div>
        </>
    )
}