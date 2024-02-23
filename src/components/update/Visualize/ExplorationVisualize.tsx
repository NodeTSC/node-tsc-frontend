import Plot from "react-plotly.js";
import 'react-tabulator/lib/styles.css';
import { chartFormatter } from '@/scripts/chartFormatter.js'
import { ReactTabulator } from 'react-tabulator'
import React, { useRef } from "react";

const ExplorationVisualize = (nodeVisualize) => {

    const visualizeData = nodeVisualize.nodeVisualize["data"]
    const visualizeMetaData = nodeVisualize.nodeVisualize["meta"]
    const visualizeLabelDist = nodeVisualize.nodeVisualize["label_distribution"]

    console.log(visualizeMetaData, visualizeLabelDist)

    var numberOfTimeseries = visualizeData["data"].length
    var colTypes = visualizeData["col_type"]

    // START TABLE COL TYPE
    var colTypeTableRef = useRef()
    var uniqueColTypes = new Set()
    var colTypeTableColumns = [
        { title: "Name", field: "name" },
        { title: "Type", field: "type" },
    ]
    if (visualizeMetaData) {
        colTypeTableColumns.push({ title: "Remark", field: "remark" })
    }
    var colTypeTableData = []
    colTypes.forEach((ct, idx) => {
        var data = {
            name: ct[0],
            type: ct[1],
        }
        // TODO: add case for excluded columns
        if (visualizeMetaData) {
            if (visualizeMetaData["target"] == ct[0]) {
                data["remark"] = "label"
            } else {

            }
        }
        colTypeTableData.push(data)
        uniqueColTypes.add(ct[1])
    })
    // END TABLE COL TYPE

    // START PLOT LABEL DIST
    var labelDistPlotData = []
    if (visualizeLabelDist) {
        var x = []
        var y = []
        
        Object.keys(visualizeLabelDist).forEach(function(key) {
            x.push(`label: ${key}`) // label
            y.push(visualizeLabelDist[key]) // count
        });

        labelDistPlotData.push({
            x: x,
            y: y,
            type: "bar"
        })
    }
    // END PLOT LABEL DIST

    // START TIME SERIES TABLE
    const timeSeriesTableColumns = [
        { title: "Index", field: "index" },
        { title: "Time Series", field: "timeseries", formatter:chartFormatter, formatterParams:{type:"line"}},
        { title: "Label", field: "label"}
    ]
    const timeSeriesTableData = []
    // END TIME SERIES TABLE

    function focusDiv(divId) {
        const divs = document.getElementsByClassName("focusable")
        Array.from(divs).forEach((div, idx) => {
            const d = document.getElementById(div.id)
            if (divId == div.id) {
                d.style.display = "block"
            } else {
                d.style.display = "none"
            }
        })
    }

    // config default rendering style
    const initStyleColTypeTable = {
        display: "block"
    }
    const initStyleTimeSeriesDistPlot = {
        display: "none"
    }
    const initStyleTimeSeriesTable = {
        display: "none"
    }
    if (visualizeMetaData && visualizeLabelDist) {
        initStyleColTypeTable.display = "none"
        initStyleTimeSeriesDistPlot.display = "none"
        initStyleTimeSeriesTable.display = "block"
    }

    return (
        <div>
            <h1>Exploration</h1>
        
            <div>Total number of timeseries: {numberOfTimeseries}</div>

            <div>
                <button onClick={() => focusDiv("colTypeTable")}>
                    Column Types
                </button>

                {visualizeData && visualizeMetaData && 
                <button onClick={() => focusDiv("timeSeriesTable")}>Time Series</button>
                }

                {visualizeMetaData && visualizeLabelDist &&
                <button onClick={() => focusDiv("timeSeriesDistPlot")}>Label Distribution</button>
                }
            </div>

            <div id="colTypeTable" className="focusable" style={initStyleColTypeTable}>
                <div className="tableActionBar">
                <label>Column Type: </label>
                <select onChange={(event) => {
                    const opt = event.target.value

                    if (opt != 'all') {
                        colTypeTableRef.current.setFilter("type", "=", opt)
                    } else {
                        colTypeTableRef.current.clearFilter()
                    }
                }}>                    
                    <option value="all">all</option>
                    { Array.from(uniqueColTypes).map((lb, idx) => <option value={lb} key={lb}>{lb}</option>)}
                </select>
                </div>
                <ReactTabulator 
                    onRef={(r) => (colTypeTableRef = r)}
                    data = {colTypeTableData}
                    columns={colTypeTableColumns}
                    layout={"fitdata"}
                    options={{
                        rowFormatter:function(row) {
                            // TODO: add formatter for exclude columns
                            if (visualizeMetaData) {
                                var target = visualizeMetaData["target"]
                                if(target && row.getData().name == target){
                                    row.getElement().style.backgroundColor = "#80ff00";
                                }
                            }
                        }
                    }}
                />
            </div>

            {visualizeData && visualizeMetaData && 
            <div id="timeSeriesTable" className="focusable" style={initStyleTimeSeriesTable}>
            <ReactTabulator 
                data={timeSeriesTableData}
                columns={timeSeriesTableColumns}
                layout={"fitdata"}
            />
            </div>
            }

            {visualizeMetaData && visualizeLabelDist &&
            <div id='timeSeriesDistPlot' className="focusable" style={initStyleTimeSeriesDistPlot}>
                <Plot 
                    data={labelDistPlotData}
                    layout={{title: "Label Distribution"}}
                    divId="plotLabelDist"
                />
            </div>
            }
        </div>
    )
}

export default ExplorationVisualize;