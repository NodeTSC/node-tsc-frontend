import React, { useState, useEffect } from 'react';
import axios from "axios";
import '../../assets/Config.css';

interface ConfigProps {
  data: any; 
}

export const Config: React.FC<ConfigProps> = ({ data }) => {
	let [disableVisualizeButton, setDisableVisualizeButton] = useState(true)
	const [nodeConfig, setNodeConfig] = useState<any[]>([]);
	const [updateData, setUpdateData] = useState<any>();

	// newly added for updated config panels
	const [prepInstructions, setPrepInstructions] = useState<any[]>([]);
	const [windowSizes, setWindowSizes] = useState<any[]>([]);

  const prepOptions = [
    { label: 'TestPrep', value: 'TestPrep' },
    { label: 'TrainPrep', value: 'TrainPrep' }
  ];

	const inputOptions = [
    { label: 'TestInput', value: 'TestInput' },
    { label: 'TrainInput', value: 'TrainInput' }
  ];

	const updateForm = {
		InputNode: {
			"id": "",
			"name": "",
			"kwargs": {
					"source": "",
					"source_type": "arff"
			}
		},
		PrepNode: {
			"id": "",
			"name": "",
			"kwargs": {
					"instructions": []
			}
		},
		DecisionTreeNode: {
			"id": "",
			"name": "DecisionTree",
			"kwargs": {
					"max_depth": 2,
					"random_state": 0,
			}
		},
		ShapeletTransformNode: {
			"id": "",
			"name": "ShapeletTransform",
			"kwargs": {
					"n_shapelets":5, 
					"window_sizes":[18],
					"sort":true,
					"random_state":0,
					"n_jobs":-1, // do not appear in config panel
					"remove_similar":true
			}
		},
		KnnNode: {
			"id" : "",
			"name": "knn",
			"kwargs": {
				"n_neighbors": 5,
				"n_jobs": -1,
			}
		}
	}

	useEffect(() => {	
		console.log(data?.type)
    // Initialize node config when data.type changes
    if (data?.type && updateForm[data.type]) {
			console.log(data);
			setUpdateData(data);
      const node = updateForm[data.type];
      setNodeConfig(Object.entries(node.kwargs).map(([key, value]) => ({
        key,
        value
      })));
	}
  }, [data]);

	function updateConfig(): void {
		console.log(updateData);
		
		
		const autoUpdate = async () => {

			try {
					const response = await axios.put(
							"http://127.0.0.1:5000/project/node",
							updateData
					);
					console.log("Update node successful:", response.data);
					if (response.status === 200) {
						setDisableVisualizeButton(true);
					}
			} catch (error) {
					console.error("Error posting data:", error);
			}
			};

			autoUpdate();
	}

	async function handleExecute() {
		setDisableVisualizeButton(true);
		try {
			const response = await axios.get('http://127.0.0.1:5000/project/execute');
			console.log('Response:', response.data);
			if (response.status === 200) {
				setDisableVisualizeButton(false);
			}
		} catch (error) {
			console.error('Error:', error);
		}
	}

	async function handleVisualization() {
		console.log("onClick handleVisualization")
		console.log(`selected node ${data?.id} type: ${data?.type}`)
		sessionStorage.setItem("nodeType", data?.type)
		sessionStorage.setItem("nodeId", data?.id)
		window.open('/visualize', '_blank', 'width=200,height=200')
	}

	function renderKwargsInputNode() {
		return(
			<div> 
				<h3>Input Node</h3>
				<select value={updateData?.name} 
				onChange={(e) => {
					const newValue = e.target.value;
					setUpdateData(prevData => ({
							...prevData,
							name: newValue
					}));
					setUpdateData(prevData => ({
						...prevData, kwargs: { ...prevData.kwargs, source: localStorage.getItem(newValue) }}))
				}}>
					<option value="">Select an option</option>
					{inputOptions.map(option => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
			</div>
		)
	}

	function renderKwargsPrepNode() {
		const TAG = "PREP DEBUG"

		// read previous instructions
		var instructions = updateData?.kwargs?.instructions || []
		var setRoleInstructions = []
		var changeTypeInstructions = []
		instructions.forEach((instructions, idx) => {
			if (instructions[0] == "set_role") {
				setRoleInstructions.push(instructions)
			} else {
				changeTypeInstructions.push(instructions)
			}
		})

		// Set Role Events
		function onAddSetRole(e) {
			var newInstructions = ["set_role", "", "target"]
			setRoleInstructions.push(newInstructions)
			updateInstructions()
		}

		function onSetRoleChange(e) {
			var idx = parseInt(e.target.parentNode.parentNode.id.split("-")[3])
			setRoleInstructions[idx][1] = e.target.value
			updateInstructions()
		}

		function onRemoveSetRole(e) {
			var idx = parseInt(e.target.parentNode.parentNode.id.split("-")[3])
			setRoleInstructions.splice(idx, 1) // remove one elements
			updateInstructions()
		}

		// Change Type Event
		function onAddChangeType(e) {
			var newInstructions = ["change_type", "", "int"]
			changeTypeInstructions.push(newInstructions)
			updateInstructions()
		}

		function onChangeTypeChange(e) {
			var idx = parseInt(e.target.parentNode.parentNode.id.split("-")[3])
			changeTypeInstructions[idx][1] = e.target.value
			updateInstructions()
		}

		function onRemoveChangeType(e) {
			var idx = parseInt(e.target.parentNode.parentNode.id.split("-")[3])
			changeTypeInstructions.splice(idx, 1) // remove one elements
			updateInstructions()
		}

		// Utils
		function updateInstructions() {
			instructions = setRoleInstructions.concat(changeTypeInstructions)
			setPrepInstructions(instructions)
			setUpdateData(prevData => ({...prevData, kwargs: { ...prevData.kwargs, instructions: instructions}}))
			console.log(instructions)
		}

		return(
		<div className='kwagrs-style'> 
			<h3>Prep Node</h3>
			<hr/>
			<h4>Set Role</h4>
			<label><i>Adding New Set Role: </i></label>
			<button onClick={ (e) => onAddSetRole(e) }>
				+
			</button>
			{ setRoleInstructions.map((instruction, idx) => {
				var previousColumn = instruction[1]
				return (
					<div id={`instruction-set-role-${idx}`}>
						<div className='input-container'>
							<label>Column:</label>
							<input 
								type='text' 
								defaultValue={previousColumn}
								onChange={(e) => { onSetRoleChange(e) }}
							/>
						</div>
						<div className='input-container'>
							<label>Role:</label>
							<select name='role'>
								<option value="target" selected>Target</option>
							</select>
						</div>
						<button onClick={(e) => {onRemoveSetRole(e)}}>del</button>
					</div>
				)
			})}
			<hr/>

			<h4>Change Type</h4>
			<label><i>Adding New Change Type: </i></label>
			<button onClick={ (e) => onAddChangeType(e) }>
				+
			</button>
			{ changeTypeInstructions.map((instruction, idx) => {
				var previousColumn = instruction[1]
				return (
					<div  id={`instruction-change-type-${idx}`}>
						<div className='input-container'> 
							<label>Column:</label>
							<input 
								type='text' 
								defaultValue={previousColumn}
								onChange={(e) => { onChangeTypeChange(e) }}
							/>
						</div>
						<div className='input-container'> 
							<label>Type:</label>
							<select name='type'>
								<option value="int" selected>int</option>
							</select>
						</div>
						<button onClick={(e) => {onRemoveChangeType(e)}}>del</button>
					</div>
				)
			})}
		</div>)
	}

	function renderKwargsApplyModel() {
		return(
		<div> 
			<h3>Apply Model Node</h3>
		</div>)
	}

	function renderKwargsShapeletTransform(){
		// TODO: (optional) add window steps as parameters
		return(
			<div className='kwagrs-style'> 
				<h3>Shapelet Transform Node</h3>
				<div className="input-container">
					<label>Number of Shapelets:</label>
					<input
						type="number"
						value={updateData?.kwargs?.["n_shapelets"]}
						onChange={(e) => setUpdateData(prevData => ({ ...prevData, kwargs: { ...prevData.kwargs, n_shapelets: parseInt(e.target.value) }}))}
					/>
				</div>
				
				{/* This is work around for generic updateData problem using onBlur (off focus)*/}
				<div className="input-container">
					<label>Window Sizes:</label>
					<input
						type='text'
						placeholder="comma (,) separated window sizes"
						value={updateData?.kwargs.window_sizes || []}
						onBlur={(e) => {
							var value = e.target.value.split(",").map((v) => parseInt(v.trim()))
							var filteredValue = []
							value.forEach((v, idx) => {
								if (!isNaN(v)) {
									filteredValue.push(v)
								}
							})
							setUpdateData(prevData => ({
								...prevData,
								kwargs: {
									...prevData.kwargs,
									window_sizes: filteredValue
								}
							}))
						}}
						onChange={(e) => {
							setUpdateData(prevData => ({
								...prevData,
								kwargs: {
									...prevData.kwargs,
									window_sizes: e.target.value
								}
							}))
						}}
					/>
				</div>

				<div className='input-container'>
					<label>Criterion:</label>
					<select value={updateData.kwargs.criterion} onChange={(e) => {
						setUpdateData(prevData => ({
							...prevData,
							kwargs: {
								...prevData.kwargs,
								criterion: e.target.value
						}
					}));
					}}>
						<option value="mutual_info">Mutual Information</option>
						<option value="anova">Anova</option>
					</select>
				</div>

				<div className="input-container">
					<label>Sort:</label>
					<select id="sort-boolean-select" 
					value={updateData?.kwargs?.["sort"]}
					onChange={(e) => {
						const newValue = e.target.value === "true";
						setUpdateData(prevData => ({
								...prevData,
								kwargs: {
									...prevData.kwargs,
									sort: newValue
							}
						}));
					}}>
					<option value="true">True</option>
					<option value="false">False</option>
				</select>
				</div>
				<div className="input-container">
					<label>Remove Similar:</label>
					<select 
						id="sort-boolean-select"
						value={updateData?.kwargs?.["remove_similar"]}
						onChange={(e) => {
								const newValue = e.target.value === "true";
								setUpdateData(prevData => ({
										...prevData,
										kwargs: {
												...prevData.kwargs,
												remove_similar: newValue
										}
								}));
						}}
					>
						<option value="true">True</option>
						<option value="false">False</option>
					</select>
				</div>
				<div className="input-container">
					<label>Seed:</label>
					<input 
							type="number" 
							value={updateData?.kwargs?.["random_state"]} 
							onChange={(e) => {
									const newValue = e.target.value;
									setUpdateData(prevData => ({
											...prevData,
											kwargs: {
													...prevData.kwargs,
													random_state: parseInt(newValue) 
											}
									}));
							}}
					/>
				</div>
			</div>)
	}

	function renderKwargsDecisionTree(){
		return(
			<div className='kwagrs-style'> 
				<h3>Decision Tree Node</h3>

				<div className="input-container">
					<label>Criterion:</label>
					<select id="sort-boolean-select" 
					value={updateData?.kwargs?.["criterion"]}
					onChange={(e) => {
						const newValue = e.target.value;
						setUpdateData(prevData => ({
								...prevData,
								kwargs: {
									...prevData.kwargs,
									criterion: newValue
							}
						}));
					}}>
						<option value="gini">Gini</option>
						<option value="entropy">Entropy</option>
						<option value="log_loss">Log Loss</option>
					</select>
				</div>

				<div className="input-container">
					<label>Split:</label>
					<select id="sort-boolean-select" 
					value={updateData?.kwargs?.["splitter"]}
					onChange={(e) => {
						const newValue = e.target.value;
						setUpdateData(prevData => ({
								...prevData,
								kwargs: {
									...prevData.kwargs,
									splitter: newValue
							}
						}));
					}}>
						<option value="best">Best</option>
						<option value="random">Random</option>
					</select>
				</div>

				<div className="input-container">
					<label>Max Depths:</label>
					<input
						type="number"
						value={updateData?.kwargs?.["max_depth"]}
						onChange={(e) => {
							const newValue = e.target.value;
							setUpdateData(prevData => ({
									...prevData,
									kwargs: {
											...prevData.kwargs,
											max_depth: parseInt(newValue) 
									}
							}));
					}}
					/>
				</div>

				<div className="input-container">
					<label>Seed:</label>
					<input 
						type='number'
						value={updateData?.kwargs.random_state}
						onChange={(e) => {
							setUpdateData(prevData => ({
								...prevData,
								kwargs: {
									...prevData.kwargs,
									random_state: parseInt(e.target.value)
								}
							}))
						}}
					/>
				</div>

				<hr/>

				<h4>Advances</h4>
				
				<div className="input-container">
					<label>Minimal Cost-Complexity Pruning:</label>
					<input
						type="number"
						step="any"
						value={updateData?.kwargs?.["ccp_alpha"]}
						onChange={(e) => {
							const newValue = e.target.value;
							setUpdateData(prevData => ({
									...prevData,
									kwargs: {
											...prevData.kwargs,
											ccp_alpha: parseFloat(newValue) 
									}
							}));
						}}
					/>
				</div>

				<div className="input-container">
					<label>Min Impurity Decrease:</label>
					<input
						type="number"
						value={updateData?.kwargs?.["min_impurity_decrease"]}
						onChange={(e) => {
							const newValue = e.target.value;
							setUpdateData(prevData => ({
									...prevData,
									kwargs: {
											...prevData.kwargs,
											min_impurity_decrease: parseFloat(newValue) 
									}
							}));
					}}
					/>
				</div>

				{/* */}
			</div>
		)
	}

	function renderKwargsKnn(){
		return(
			<div className='kwagrs-style'>
				<h3>KNN Node</h3>
				<div className='input-container'>
					<label>Number of Neighbors</label>
					<input 
						type='number'
						value={updateData?.kwargs?.n_neighbors}
						onChange={(e) => {
							setUpdateData(prevData => ({
								...prevData,
								kwargs: {
									...prevData.kwargs,
									n_neighbors: parseInt(e.target.value)
								}
							}));
						}}
					/>
				</div>

				<div className="input-container">
					<label>Algorithm:</label>
					<select id="sort-boolean-select" 
					value={updateData?.kwargs?.["algorithm"]}
					onChange={(e) => {
						const newValue = e.target.value;
						setUpdateData(prevData => ({
								...prevData,
								kwargs: {
									...prevData.kwargs,
									algorithm: newValue
							}
						}));
					}}>
						<option value="auto">Auto</option>
						<option value="ball_tree">Ball Tree</option>
						<option value="kd_tree">kd Tree</option>
						<option value="brute">Brute</option>
					</select>
				</div>

				<div className="input-container">
					<label>Power parameter:</label>
					<input
						type="float"
						value={updateData?.kwargs?.["p"]}
						onChange={(e) => {
							const newValue = e.target.value;
							setUpdateData(prevData => ({
									...prevData,
									kwargs: {
											...prevData.kwargs,
											p: parseInt(newValue) 
									}
							}));
					}}
					/>
				</div>

				<div className="input-container">
					<label>Weights:</label>
					<select id="sort-boolean-select" 
					value={updateData?.kwargs?.["weights"]}
					onChange={(e) => {
						const newValue = e.target.value;
						setUpdateData(prevData => ({
								...prevData,
								kwargs: {
									...prevData.kwargs,
									weights: newValue
							}
						}));
					}}>
						<option value="uniform">Uniform</option>
						<option value="distance">Distance</option>
					</select>
				</div>
			</div>
		);
	}

	function renderKwargs() {
		return (
			<div className='kwargs-box'>
					{data?.type === "PrepNode" ? (
							<div> 
								{renderKwargsPrepNode()}
							</div>
					) : data?.type === "InputNode" ? (
							<div> 
								{renderKwargsInputNode()}
							</div>
					) : data?.type === "ApplyModelNode" ? (
						<div> 
							{renderKwargsApplyModel()}
						</div>
					) : data?.type === "ShapeletTransformNode" ? (
						<div> 
							{renderKwargsShapeletTransform()}
						</div>
					) : data?.type === "DecisionTreeNode" ? (
						<div> 
							{renderKwargsDecisionTree()}
						</div>
					) : data?.type === "KnnNode" ? (
						<div> 
							{renderKwargsKnn()}
						</div>
					) : (
						<h3>Please Select Node</h3>
					)}
			</div>
		);
	}

	const handleShowOpenWindow = async ()=> {
		console.log(`selected node ${data?.id} type: ${data?.type}`)
		localStorage.setItem("nodeId", data?.id)
		const result = await (window as any).electron.viz.showOpenWindow();
		console.log(result);
	}

	const handleResetProject = async () => {
		try {
		  await axios.get('http://127.0.0.1:5000/project/reset');
		  window.location.reload(); // Reload the window after successful reset
		} catch (error) {
		  console.error('Error resetting project:', error);
		}
	  };

	return (
    <div className='panel'>
			{updateData && renderKwargs()}
			<button onClick={updateConfig}>Update</button>
			<button onClick={handleExecute}>Execute</button>
			{!disableVisualizeButton && (
				<button onClick={handleShowOpenWindow}>Visualize</button>
			)}<br/>
			<button className='reset-project' onClick={handleResetProject}>Reset Project</button>
    </div>
  );
};
