class B787_10_SYS extends B787_10_CommonMFD.MFDTemplateElement {
	constructor() {
		super(...arguments);
		this.allPageButtons = new Array();
		this.currentPage = null;
		this.navHighlight = -1;
		this.navHighlightTimer = -1.0;
		this.navHighlightLastIndex = 0;
	}

	get templateID() {
		return 'B787_10_SYS_Template';
	}

	get pageIdentifier() {
		return MFDPageType.SYS;
	}

	initChild() {
		if (this.allPageButtons == null) {
			this.allPageButtons = new Array();
		}
		var pageButtonSmallTemplate = this.querySelector('#PageButtonSmallTemplate');
		var pageButtonLargeTemplate = this.querySelector('#PageButtonLargeTemplate');
		if (pageButtonSmallTemplate != null) {
			this.allPageButtons.push(new B787_10_SYS_Page_STAT(this, pageButtonSmallTemplate));
			this.allPageButtons.push(new B787_10_SYS_Page_ELEC(this, pageButtonSmallTemplate));
			this.allPageButtons.push(new B787_10_SYS_Page_HYD(this, pageButtonSmallTemplate));
			this.allPageButtons.push(new B787_10_SYS_Page_FUEL(this, pageButtonSmallTemplate));
			this.allPageButtons.push(new B787_10_SYS_Page_AIR(this, pageButtonSmallTemplate));
			this.allPageButtons.push(new B787_10_SYS_Page_DOOR(this, pageButtonSmallTemplate));
			pageButtonSmallTemplate.remove();
		}
		if (pageButtonLargeTemplate != null) {
			this.allPageButtons.push(new B787_10_SYS_Page_GEAR(this, pageButtonLargeTemplate));
			this.allPageButtons.push(new B787_10_SYS_Page_FCTL(this, pageButtonLargeTemplate));
			this.allPageButtons.push(new B787_10_SYS_Page_EFIS_DSP(this, pageButtonLargeTemplate));
			this.allPageButtons.push(new B787_10_SYS_Page_MAINT(this, pageButtonLargeTemplate));
			this.allPageButtons.push(new B787_10_SYS_Page_CB(this, pageButtonLargeTemplate));
			pageButtonLargeTemplate.remove();
		}
		if (this.allPageButtons != null) {
			for (var i = 0; i < this.allPageButtons.length; ++i) {
				if (this.allPageButtons[i] != null) {
					this.allPageButtons[i].init();
				}
			}
		}
		this.setPageActiveByName('FUEL');
	}

	updateChild(_deltaTime) {
		if (this.currentPage != null) {
			this.currentPage.update(_deltaTime);
		}
		if (this.navHighlightTimer >= 0) {
			this.navHighlightTimer -= _deltaTime / 1000;
			if (this.navHighlightTimer <= 0) {
				this.setNavHighlight(-1);
				this.navHighlightTimer = -1;
			}
		}
	}

	onEvent(_event) {
		if (_event.startsWith('CHANGE_SYS_PAGE_')) {
			this.setPageActiveByName(_event.replace('CHANGE_SYS_PAGE_', ''));
		} else {
			switch (_event) {
				case 'Cursor_DEC':
					if (this.navHighlight > 0)
						this.setNavHighlight(this.navHighlight - 1);
					else if (this.navHighlight == -1)
						this.setNavHighlight(this.navHighlightLastIndex);
					break;
				case 'Cursor_INC':
					if (this.navHighlight >= 0 && this.navHighlight < this.allPageButtons.length - 1)
						this.setNavHighlight(this.navHighlight + 1);
					else if (this.navHighlight == -1)
						this.setNavHighlight(this.navHighlightLastIndex);
					break;
				case 'Cursor_Press':
					if (this.navHighlight >= 0) {
						this.allPageButtons[this.navHighlight].trigger();
					}
					break;
			}
		}
	}

	setGPS(_gps) {
	}

	setPageActiveByIndex(_index) {
		if ((_index >= 0) && (this.allPageButtons != null) && (_index < this.allPageButtons.length)) {
			for (var i = 0; i < this.allPageButtons.length; ++i) {
				if (this.allPageButtons[i] != null) {
					if (i == _index) {
						this.allPageButtons[i].isActive = true;
						this.currentPage = this.allPageButtons[i];
						this.navHighlightLastIndex = _index;
					} else {
						this.allPageButtons[i].isActive = false;
					}
				}
			}
		}
	}

	setPageActiveByName(_name) {
		if (this.allPageButtons != null) {
			for (var i = 0; i < this.allPageButtons.length; ++i) {
				if (this.allPageButtons[i] != null) {
					if (_name == this.allPageButtons[i].getName()) {
						this.setPageActiveByIndex(i);
						break;
					}
				}
			}
		}
	}

	setNavHighlight(_index) {
		if (this.navHighlight != _index) {
			if (this.navHighlight >= 0) {
				this.navHighlight = -1;
				this.navHighlightTimer = -1.0;
			}
			if (_index >= 0) {
				this.navHighlight = _index;
				this.navHighlightTimer = 5.0;
				this.navHighlightLastIndex = _index;
			}
			for (var i = 0; i < this.allPageButtons.length; ++i) {
				if (i == this.navHighlight) {
					this.allPageButtons[i].isHighlight = true;
				} else {
					this.allPageButtons[i].isHighlight = false;
				}
			}
		}
	}
}

class B787_10_SYS_Page {
	constructor(_sys, _buttonTemplate) {
		this.sys = null;
		this.buttonRoot = null;
		this.pageRoot = null;
		this.active = false;
		this.allTextValueComponents = new Array();
		this.gallonToMegagrams = 0;
		this.gallonToMegapounds = 0;
		this.sys = _sys;
		if (_sys != null) {
			var pageButtonRoot = _sys.querySelector('#' + this.getName() + '_PageButton');
			if ((pageButtonRoot != null) && (_buttonTemplate != null)) {
				this.buttonRoot = _buttonTemplate.cloneNode(true);
				this.buttonRoot.removeAttribute('id');
				pageButtonRoot.appendChild(this.buttonRoot);
				this.buttonRoot.addEventListener('mouseup', this.trigger.bind(this));
				var textElement = this.buttonRoot.querySelector('text');
				if (textElement != null) {
					textElement.textContent = this.getName().replace('_', '/');
				}
			}
			this.pageRoot = _sys.querySelector('#' + this.getName() + '_Page');
		}
		this.gallonToMegagrams = SimVar.GetSimVarValue('FUEL WEIGHT PER GALLON', 'kilogram') * 0.001;
		this.gallonToMegapounds = SimVar.GetSimVarValue('FUEL WEIGHT PER GALLON', 'lbs') * 0.001;

		this.B78XH_SystemsInfo = new B78XH_SystemsInfo();
	}

	set isActive(_active) {
		this.active = _active;
		if (this.buttonRoot != null) {
			if (this.active) {
				this.buttonRoot.classList.add('page-button-active');
				this.buttonRoot.classList.remove('page-button-inactive');
			} else {
				this.buttonRoot.classList.remove('page-button-active');
				this.buttonRoot.classList.add('page-button-inactive');
			}
		}
		if (this.pageRoot != null) {
			this.pageRoot.style.display = this.active ? 'block' : 'none';
		}
	}

	set isHighlight(_highlight) {
		if (this.buttonRoot != null) {
			if (_highlight) {
				this.buttonRoot.classList.add('page-button-highlight');
			} else {
				this.buttonRoot.classList.remove('page-button-highlight');
			}
		}
	}

	init() {
		if (this.pageRoot != null) {
			var inopText = document.createElementNS(Avionics.SVG.NS, 'text');
			inopText.setAttribute('x', '50%');
			inopText.setAttribute('y', '5%');
			inopText.setAttribute('fill', 'var(--eicasWhite)');
			inopText.setAttribute('fill', 'var(--eicasWhite)');
			inopText.setAttribute('font-size', '45px');
			inopText.setAttribute('text-anchor', 'middle');
			inopText.textContent = 'INOP';
			this.pageRoot.appendChild(inopText);
		}
	}

	update(_deltaTime) {
		if (this.active) {
			if (this.allTextValueComponents != null) {
				for (var i = 0; i < this.allTextValueComponents.length; ++i) {
					if (this.allTextValueComponents[i] != null) {
						this.allTextValueComponents[i].refresh();
					}
				}
			}
			this.updateChild(_deltaTime);
		}
	}

	trigger() {
		this.sys.onEvent('CHANGE_SYS_PAGE_' + this.getName());
	}

	getTotalFuelInMegagrams() {
		let factor = this.gallonToMegapounds;
		if (BaseAirliners.unitIsMetric(Aircraft.AS01B))
			factor = this.gallonToMegagrams;
		return (SimVar.GetSimVarValue('FUEL TOTAL QUANTITY', 'gallons') * factor);
	}

	getMainTankFuelInMegagrams(_index) {
		let factor = this.gallonToMegapounds;
		if (BaseAirliners.unitIsMetric(Aircraft.AS01B))
			factor = this.gallonToMegagrams;
		return (SimVar.GetSimVarValue('FUELSYSTEM TANK QUANTITY:' + _index, 'gallons') * factor);
	}

	getApuRPM() {
		return this.B78XH_SystemsInfo.getAPU().getRPM() || 1;
	}

	getApuEGT() {
		let egt = this.B78XH_SystemsInfo.getAPU().getEGT();
		return egt || SimVar.GetSimVarValue('AMBIENT TEMPERATURE', 'Celsius');
	}

	getApuOilPress() {
		let oilPress = this.B78XH_SystemsInfo.getAPU().getOilPress();
		return oilPress || 5;
	}

	getApuOilTemp() {
		let oilTemp = this.B78XH_SystemsInfo.getAPU().getOilTemp();
		return oilTemp || 15;
	}
}

class B787_10_SYS_Page_STAT extends B787_10_SYS_Page {
	init() {
		if (this.pageRoot != null) {
			this.hydraulicPressureLeft = 80;
			this.hydraulicPressureCenter = 80;
			this.hydraulicPressureRight = 85;
			this.allTextValueComponents.push(new Airliners.DynamicValueComponent(this.pageRoot.querySelector('#box-content-value-rpm-apu'), this.getApuRPM.bind(this), 1));
			this.allTextValueComponents.push(new Airliners.DynamicValueComponent(this.pageRoot.querySelector('#box-content-value-egt-apu-span'), this.getApuEGT.bind(this), 0));
			this.allTextValueComponents.push(new Airliners.DynamicValueComponent(this.pageRoot.querySelector('#box-content-value-oil-press-apu-span'), this.getApuOilPress.bind(this), 0));
			this.allTextValueComponents.push(new Airliners.DynamicValueComponent(this.pageRoot.querySelector('#box-content-value-oil-temp-apu-span'), this.getApuOilTemp.bind(this), 0));
		}
	}

	updateChild(_deltaTime) {

	}

	getName() {
		return 'STAT';
	}
}

class B787_10_SYS_Page_ELEC extends B787_10_SYS_Page {
	updateChild(_deltaTime) {
	}

	getName() {
		return 'ELEC';
	}
}

class B787_10_SYS_Page_HYD extends B787_10_SYS_Page {
	constructor() {
		super(...arguments);
		this.greenLines = {
			'l-eng-green': null,
			'r-eng-green': null,
			'l-elec-green': null,
			'r-elec-green': null,
			'c1-elec-green': null,
			'c1-c2-elec-green': null,
			'c2-elec-green': null
		};
	}

	init() {

	}

	updateChild(_deltaTime) {
		this.greenLines['l-eng-green'] = SimVar.GetSimVarValue('A:HYDRAULIC SWITCH:1', 'Boolean');
		this.greenLines['r-eng-green'] = SimVar.GetSimVarValue('A:HYDRAULIC SWITCH:2', 'Boolean');
		this.greenLines['l-elec-green'] = SimVar.GetSimVarValue('L:B78XH_HYDRAULIC_ELEC_L_SWITCH_STATE', 'Number');
		this.greenLines['r-elec-green'] = SimVar.GetSimVarValue('L:B78XH_HYDRAULIC_ELEC_R_SWITCH_STATE', 'Number');
		this.greenLines['c1-elec-green'] = SimVar.GetSimVarValue('L:B78XH_HYDRAULIC_ELEC_C1_SWITCH_STATE', 'Number');
		this.greenLines['c2-elec-green'] = SimVar.GetSimVarValue('L:B78XH_HYDRAULIC_ELEC_C2_SWITCH_STATE', 'Number');

		Object.keys(this.greenLines).forEach((key) => {
			this.shouldBeEnabled(key);
		});
	}

	shouldBeEnabled(key) {
		if (this.greenLines[key]) {
			let element = this.pageRoot.querySelector('#' + key);
			switch (key) {
				case 'l-eng-green':
					element.setAttribute('state', 'on');
					break;
				case 'r-eng-green':
					element.setAttribute('state', 'on');
					break;
				case 'l-elec-green':
					if (this.greenLines[key] > 1 || (this.greenLines[key] === 1 && this.greenLines['l-eng-green'] === 0)) {
						element.setAttribute('state', 'on');
					} else {
						element.setAttribute('state', 'off');
					}
					break;
				case 'r-elec-green':
					if (this.greenLines[key] > 1 || (this.greenLines[key] === 1 && this.greenLines['r-eng-green'] === 0)) {
						element.setAttribute('state', 'on');
					} else {
						element.setAttribute('state', 'off');
					}
					break;
				case 'c1-elec-green':
					if (this.greenLines[key] >= 1) {
						element.setAttribute('state', 'on');
					} else {
						element.setAttribute('state', 'off');
					}
					break;
				case 'c1-c2-elec-green':
					element.setAttribute('state', 'off');
					break;
				case 'c2-elec-green':
					if (this.greenLines[key] > 1 || (this.greenLines[key] === 1 && this.greenLines['c1-elec-green'] === 0)) {
						element.setAttribute('state', 'on');
					} else {
						element.setAttribute('state', 'off');
					}
					break;
				default:
					element.setAttribute('state', 'off');
					break;
			}
		} else {
			let element = this.pageRoot.querySelector('#' + key);
			element.setAttribute('state', 'off');
		}

	}

	getName() {
		return 'HYD';
	}
}

class B787_10_SYS_Page_FUEL extends B787_10_SYS_Page {
	constructor() {
		super(...arguments);
		this.allFuelComponents = null;
	}

	init() {
		if (this.allFuelComponents == null) {
			this.allFuelComponents = new Array();
		}
		if (this.pageRoot != null) {
			this.unitTextSVG = this.pageRoot.querySelector('#TotalFuelUnits');
			this.allTextValueComponents.push(new Airliners.DynamicValueComponent(this.pageRoot.querySelector('#TotalFuelValue'), this.getTotalFuelInMegagrams.bind(this), 1));
			this.allTextValueComponents.push(new Airliners.DynamicValueComponent(this.pageRoot.querySelector('#Tank1Quantity'), this.getMainTankFuelInMegagrams.bind(this, 1), 1));
			this.allTextValueComponents.push(new Airliners.DynamicValueComponent(this.pageRoot.querySelector('#Tank2Quantity'), this.getMainTankFuelInMegagrams.bind(this, 2), 1));
			this.allTextValueComponents.push(new Airliners.DynamicValueComponent(this.pageRoot.querySelector('#Tank3Quantity'), this.getMainTankFuelInMegagrams.bind(this, 3), 1));
			this.allFuelComponents.push(new Boeing.FuelEngineState(this.pageRoot.querySelector('#Engine1FuelState'), 1));
			this.allFuelComponents.push(new Boeing.FuelEngineState(this.pageRoot.querySelector('#Engine2FuelState'), 2));
			var fuelPumpsGroup = this.pageRoot.querySelector('#FuelPumps');
			if (fuelPumpsGroup != null) {
				var allFuelPumps = fuelPumpsGroup.querySelectorAll('rect');
				if (allFuelPumps != null) {
					for (var i = 0; i < allFuelPumps.length; ++i) {
						this.allFuelComponents.push(new Boeing.FuelPump(allFuelPumps[i], parseInt(allFuelPumps[i].id.replace('FuelPump', ''))));
					}
				}
			}
			var fuelValvesGroup = this.pageRoot.querySelector('#FuelValves');
			if (fuelValvesGroup != null) {
				var fuelValveTemplate = this.pageRoot.querySelector('#FuelValveTemplate');
				if (fuelValveTemplate != null) {
					var allFuelValves = fuelValvesGroup.querySelectorAll('g');
					if (allFuelValves != null) {
						for (var i = 0; i < allFuelValves.length; ++i) {
							var clonedValve = fuelValveTemplate.cloneNode(true);
							clonedValve.removeAttribute('id');
							allFuelValves[i].appendChild(clonedValve);
							this.allFuelComponents.push(new Boeing.FuelValve(allFuelValves[i], parseInt(allFuelValves[i].id.replace('FuelValve', ''))));
						}
					}
					fuelValveTemplate.remove();
				}
			}
			var fuelLinesGroup = this.pageRoot.querySelector('#FuelLines');
			if (fuelLinesGroup != null) {
				var allFuelLines = fuelLinesGroup.querySelectorAll('line, polyline, g');
				if (allFuelLines != null) {
					for (var i = 0; i < allFuelLines.length; ++i) {
						var id = parseInt(allFuelLines[i].id.replace('FuelLine', ''));
						if ((id != NaN) && (id > 0)) {
							this.allFuelComponents.push(new Boeing.FuelLine(allFuelLines[i], id));
						}
					}
				}
			}
		}
		if (this.allFuelComponents != null) {
			for (var i = 0; i < this.allFuelComponents.length; ++i) {
				if (this.allFuelComponents[i] != null) {
					this.allFuelComponents[i].init();
				}
			}
		}
	}

	updateChild(_deltaTime) {
		if (this.allFuelComponents != null) {
			for (var i = 0; i < this.allFuelComponents.length; ++i) {
				if (this.allFuelComponents[i] != null) {
					this.allFuelComponents[i].update(_deltaTime);
				}
			}
		}
		if (this.unitTextSVG) {
			if (BaseAirliners.unitIsMetric(Aircraft.B747_8))
				this.unitTextSVG.textContent = 'KGS X 1000';
			else
				this.unitTextSVG.textContent = 'LBS X 1000';
		}
	}

	getName() {
		return 'FUEL';
	}
}

class B787_10_SYS_Page_AIR extends B787_10_SYS_Page {
	updateChild(_deltaTime) {
	}

	getName() {
		return 'AIR';
	}
}

class B787_10_SYS_Page_DOOR extends B787_10_SYS_Page {
	/**
	 * Points:
	 * 0 -> Entry 1L
	 * 7 -> Entry 4R
	 * 8 -> FWD Cargo
	 * 11 -> Fuel
	 * 12 -> Power Unit (Front gear)
	 */
	init() {
		this.doors = {
			ENTRY_1L: null,
			ENTRY_2L: null,
			ENTRY_3L: null,
			ENTRY_4L: null,
			FWS_EE_ACCESS: null,
			REFUEL: null,
			AFT_EE_ACCESS: null,
			BULK_CARGO: null,
			ENTRY_1R: null,
			ENTRY_2R: null,
			ENTRY_3R: null,
			ENTRY_4R: null,
			FWD_ACCESS: null,
			FD_OVHD: null,
			FWD_CARGO: null,
			AFT_CARGO: null
		};

		this.doorsGroups = {
			ENTRY_1L: [['entry_1l_close'], ['entry_1l_open']],
			ENTRY_2L: [[], []],
			ENTRY_3L: [[], []],
			ENTRY_4L: null,
			FWS_EE_ACCESS: null,
			REFUEL: null,
			AFT_EE_ACCESS: null,
			BULK_CARGO: null,
			ENTRY_1R: null,
			ENTRY_2R: null,
			ENTRY_3R: null,
			ENTRY_4R: [['entry_4r_close'], ['entry_4r_open']],
			FWD_ACCESS: null,
			FD_OVHD: null,
			FWD_CARGO: [['fwd_cargo_open'], ['fwd_cargo_open']],
			AFT_CARGO: null
		};

		this.updateDoorPositions();
		this.updatePage();
	}

	updateChild(_deltaTime) {
		this.updateDoorPositions();
		this.updatePage();
	}

	updatePage() {
		let closeRect1l = this.pageRoot.querySelector('#entry_1l_close_rect');
		let closeText1l = this.pageRoot.querySelector('#entry_1l_close_text');
		let openRect1l = this.pageRoot.querySelector('#entry_1l_open');

		if (this.doors['ENTRY_1L'] > 5) {
			closeRect1l.style.visibility = 'hidden';
			closeText1l.style.visibility = 'hidden';
			openRect1l.style.visibility = 'visible';
		} else {
			closeRect1l.style.visibility = 'visible';
			closeText1l.style.visibility = 'visible';
			openRect1l.style.visibility = 'hidden';
		}

		let closeRect4r = this.pageRoot.querySelector('#entry_4r_close_rect');
		let closeText4r = this.pageRoot.querySelector('#entry_4r_close_text');
		let openRect4r = this.pageRoot.querySelector('#entry_4r_open');
		if (this.doors['ENTRY_4R'] > 5) {
			closeRect4r.style.visibility = 'hidden';
			closeText4r.style.visibility = 'hidden';
			openRect4r.style.visibility = 'visible';
		} else {
			closeRect4r.style.visibility = 'visible';
			closeText4r.style.visibility = 'visible';
			openRect4r.style.visibility = 'hidden';
		}
		let closeRectFwdCargo = this.pageRoot.querySelector('#fwd_cargo_open');
		if (this.doors['FWD_CARGO'] > 5) {
			closeRectFwdCargo.style.visibility = 'visible';
		} else {
			closeRectFwdCargo.style.visibility = 'hidden';
		}
	}

	updateDoorPositions() {
		this.doors['ENTRY_1L'] = SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:0', 'Percent');
		this.doors['ENTRY_4R'] = SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:7', 'Percent');
		this.doors['FWD_CARGO'] = SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:8', 'Percent');
	}

	getName() {
		return 'DOOR';
	}
}

class B787_10_SYS_Page_GEAR extends B787_10_SYS_Page {
	init() {
		if (this.pageRoot != null) {
			this.gearDisplay = new Boeing.GearDisplay(this.pageRoot.querySelector('#gear-doors'));
		}
	}

	updateChild(_deltaTime) {
		if (this.gearDisplay != null) {
			this.gearDisplay.update(_deltaTime);
		}
	}

	getName() {
		return 'GEAR';
	}
}

class B787_10_SYS_Page_FCTL extends B787_10_SYS_Page {
	updateChild(_deltaTime) {
	}

	getName() {
		return 'FCTL';
	}
}

class B787_10_SYS_Page_EFIS_DSP extends B787_10_SYS_Page {
	updateChild(_deltaTime) {
	}

	getName() {
		return 'EFIS_DSP';
	}
}

class B787_10_SYS_Page_MAINT extends B787_10_SYS_Page {
	updateChild(_deltaTime) {
	}

	getName() {
		return 'MAINT';
	}
}

class B787_10_SYS_Page_CB extends B787_10_SYS_Page {
	updateChild(_deltaTime) {
	}

	getName() {
		return 'CB';
	}
}

customElements.define('b787-10-sys-element', B787_10_SYS);
//# sourceMappingURL=B787_10_SYS.js.map