import {useSetRecoilState} from "recoil";
import {selectedTabAtom} from "../../state/atoms";
import React from "react";

export const Stats = () => {
    const setTab = useSetRecoilState(selectedTabAtom)
    React.useEffect(() => {
        setTab("Statistiky")
    })
    return(
        <div className="content-wrap_inner">
            <div className="content-2-column">
                <div className="content-box">
                    <div className="content-box_content">
                        <h1>Moje statistiky</h1>
                    </div>
                </div>
                <div className="content-2-row">
                    <div className="content-box">
                        <div className="content-box_content">
                            <h1>Můj harmonogram</h1>
                        </div>
                    </div>
                    <div className="content-box">
                        <div className="content-box_content">
                            <h1>Můj čas</h1>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
