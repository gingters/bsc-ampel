import { ITournamentConfig, ITournamentState } from '../tournament';

interface IMessage {
	type: string;
	payload: object;
}

const config: ITournamentConfig = {
	alternatingShooters: true,
	arrowsPerEnd: 3,
	numberOfEnds: 20,
	secondsPerArrow: 40,
	waitTimeInSeconds: 10,
	yellowPhaseInSeconds: 30,
};

// changeable values
let socket: WebSocket;

let serverState: ITournamentState = {
	currentLight: 'red',
	currentShooters: 'A/B',
	endsShot: 0,
	honks: 0,
	secondsLeft: 0,
	shooting: false,
	totalEnds: config.numberOfEnds,
};

function init() {
	socket =  new WebSocket(`ws://${window.location.host}`);

	socket.addEventListener('open', () => {
		// do this on the callback, because we immediately send back the config
		resetAll();
	});

	socket.addEventListener('message', (event) => {
		const message: IMessage = JSON.parse(event.data);

		if (message.type === 'state-update') {
			updateState(message.payload as ITournamentState);
		}
	});

	selectTab('control');
}

function updateState(state: ITournamentState) {
	serverState = state;
	honk(state.honks);
}

function send(type: string, payload: any) {
	const message = JSON.stringify({ type: type, payload: payload });
	socket.send(message);
}

// TAB Controls
function selectTab(tabName: string) {
	// unselect all tabs
	const tabs = Array.from(document.getElementsByClassName('tablink'));
	for (const tab of tabs) {
		tab.classList.remove('is-active');
	}

	// make all contents invisible
	const tabContents = Array.from(document.getElementsByClassName('tabcontent'));
	for (const tabContent of tabContents) {
		tabContent.classList.remove('is-active');
		// (tabContent as HTMLElement).style.display = 'none';
	}

	document.getElementById(tabName + '-tab').classList.add('is-active');
	document.getElementById(tabName + '-content').classList.add('is-active');
	// document.getElementById(tabName + '-content').style.display = 'flex';
}

function resetAll() {
	loadAllSettings();
}

function loadAllSettings() {
	loadWaitTimeInSeconds();
	loadArrowsPerEnd();
	loadSecondsPerArrow();
	loadYellowPhaseInSeconds();
	loadNumberOfEnds();
	loadAlternatingShooters();

	updateShootingTime();
	saveSettings();
}

function loadWaitTimeInSeconds() {
	config.waitTimeInSeconds = loadNumberWithDefault('waitTimeInSeconds', 10);
	const elem = document.getElementById('waitTimeInSeconds') as HTMLInputElement;
	elem.value = String(config.waitTimeInSeconds);
}

function loadArrowsPerEnd() {
	config.arrowsPerEnd = loadNumberWithDefault('arrowsPerEnd', 3);
	const elem = document.getElementById('arrowsPerEnd') as HTMLInputElement;
	elem.value = String(config.arrowsPerEnd);
}

function loadSecondsPerArrow() {
	config.secondsPerArrow = loadNumberWithDefault('secondsPerArrow', 40);
	const elem = document.getElementById('secondsPerArrow') as HTMLInputElement;
	elem.value = String(config.secondsPerArrow);
}

function loadYellowPhaseInSeconds() {
	config.yellowPhaseInSeconds = loadNumberWithDefault('yellowPhaseInSeconds', 30);
	const elem = document.getElementById('yellowPhaseInSeconds') as HTMLInputElement;
	elem.value = String(config.yellowPhaseInSeconds);
}

function loadNumberOfEnds() {
	config.numberOfEnds = loadNumberWithDefault('numberOfEnds', 20);
	const elem = document.getElementById('numberOfEnds') as HTMLInputElement;
	elem.value = String(config.numberOfEnds);
}

function loadAlternatingShooters() {
	config.alternatingShooters = loadBooleanWithDefault('alternatingShooters', true);
	const elem = document.getElementById('alternatingShooters') as HTMLInputElement;
	elem.checked = config.alternatingShooters;
}

function loadValueWithDefault(key: string, value: string | number): string {
	let loadedString: string = localStorage.getItem(key);
	if (loadedString === null) {
		localStorage.setItem(key, value as string);
		loadedString = value as string;
	}

	return loadedString;
}

function loadNumberWithDefault(key: string, value: number): number {
	const loadedString = loadValueWithDefault(key, value);
	return parseInt(loadedString, 10);
}

function loadBooleanWithDefault(key: string, value: boolean): boolean {
	const loadedString = loadValueWithDefault(key, value ? 'true' : 'false');
	return loadedString === 'true';
}

function saveNumberValue(key: string, newValue: number): number {
	saveValue(key, String(newValue));
	return newValue;
}

function saveBooleanValue(key: string, newValue: boolean): boolean {
	saveValue(key, newValue ? 'true' : 'false');
	return newValue;
}

function saveValue(key: string, newValue: string): string {
	localStorage.setItem(key, newValue);
	return newValue;
}

function startEnd() {
	send('ui-command', { command: 'start-end' });
}

function honk(amount: number) {
	const blinkInterval = 500;
	const honker = document.getElementById('trafficlight');

	for (let i = 1 ; i <= amount; i++) {
		const startTime = i * 2 * blinkInterval - blinkInterval;
		const endTime = i * 2 * blinkInterval;

		setTimeout(() => { honker.classList.add('honk'); }, startTime);
		setTimeout(() => { honker.classList.remove('honk'); }, endTime);
	}
}

function endEnd() {
	send('ui-command', { command: 'abort-end' });
}

function twoDigit(value: number) {
	return value.toString().padStart(2, '0');
}

function updateUi() {
	// manage lights
	const lights = Array.from(document.getElementsByClassName('light'));
	for (const light of lights) {
		light.classList.remove('is-active');
	}
	document.getElementById(`light-${serverState.currentLight}`).classList.add('is-active');

	// manage displays
	document.getElementById('shooters').innerHTML = serverState.currentShooters;
	document.getElementById('ends').innerHTML = `${serverState.endsShot} / ${serverState.totalEnds}`;
	document.getElementById('remainingTime').innerHTML = formatRemainingTime();

	// manage buttons
	(document.getElementById('button-start') as HTMLInputElement).disabled = serverState.shooting;
	(document.getElementById('button-abort') as HTMLInputElement).disabled = serverState.currentLight === 'red';
	(document.getElementById('button-reset') as HTMLInputElement).disabled =
		serverState.shooting || serverState.endsShot === 0;
}

function formatRemainingTime() {
	if (serverState.secondsLeft < 0) {
		return '-/-';
	}

	const minutes = Math.floor(serverState.secondsLeft / 60);
	const seconds = serverState.secondsLeft % 60;

	return `${minutes}:${twoDigit(seconds)}`;
}

function changeWaitTimeInSeconds(val: number) {
	config.waitTimeInSeconds = config.waitTimeInSeconds + val;
	(document.getElementById('waitTimeInSeconds') as HTMLInputElement).value =
		String(config.waitTimeInSeconds);
}

function changeYellowPhaseInSeconds(val: number) {
	config.yellowPhaseInSeconds = config.yellowPhaseInSeconds + val;
	(document.getElementById('yellowPhaseInSeconds') as HTMLInputElement).value =
		String(config.yellowPhaseInSeconds);
}

function changeSecondsPerArrow(val: number) {
	config.secondsPerArrow = config.secondsPerArrow + val;
	(document.getElementById('secondsPerArrow') as HTMLInputElement).value = String(config.secondsPerArrow);
	updateShootingTime();
}

function changeArrowsPerEnd(val: number) {
	config.arrowsPerEnd = config.arrowsPerEnd + val;
	(document.getElementById('arrowsPerEnd') as HTMLInputElement).value = String(config.arrowsPerEnd);
	updateShootingTime();
}

function changeNumberOfEnds(val: number) {
	config.numberOfEnds = config.numberOfEnds + val;
	(document.getElementById('numberOfEnds') as HTMLInputElement).value = String(config.numberOfEnds);
}

function changeAlternatingShooters() {
	const elem = document.getElementById('alternatingShooters') as HTMLInputElement;
	config.alternatingShooters = elem.checked;
}

function updateShootingTime() {
	const time = config.secondsPerArrow * config.arrowsPerEnd;
	document.getElementById('shootingTimeInSeconds').innerHTML =
		`${config.secondsPerArrow} Sek./Pfeil * ${config.arrowsPerEnd} Pfeile/Passe = ${time} Sek. Schießzeit`;
}

function deleteAllSettings() {
	localStorage.clear();
	loadAllSettings();
}

function closeApplication() {
	send('ui-command', { command: 'close-application' });
}

function saveSettings() {
	const settings = {
		alternatingShooters: saveBooleanValue('alternatingShooters', config.alternatingShooters),
		arrowsPerEnd: saveNumberValue('arrowsPerEnd', config.arrowsPerEnd),
		numberOfEnds: saveNumberValue('numberOfEnds', config.numberOfEnds),
		secondsPerArrow: saveNumberValue('secondsPerArrow', config.secondsPerArrow),
		waitTimeInSeconds: saveNumberValue('waitTimeInSeconds', config.waitTimeInSeconds),
		yellowPhaseInSeconds: saveNumberValue('yellowPhaseInSeconds', config.yellowPhaseInSeconds),
	};

	send('ui-command', { command: 'save-settings', settings: settings });
}

function reset() {
	send('ui-command', { command: 'reset' });
}

setInterval(updateUi, 100);
init();

// export functions
const wnd = window as any;
wnd.send = send;
wnd.closeApplication = closeApplication;
wnd.deleteAllSettings = deleteAllSettings;
wnd.changeArrowsPerEnd = changeArrowsPerEnd;
wnd.changeSecondsPerArrow = changeSecondsPerArrow;
wnd.changeYellowPhaseInSeconds = changeYellowPhaseInSeconds;
wnd.changeWaitTimeInSeconds = changeWaitTimeInSeconds;
wnd.changeNumberOfEnds = changeNumberOfEnds;
wnd.changeAlternatingShooters = changeAlternatingShooters;
wnd.endEnd = endEnd;
wnd.startEnd = startEnd;
wnd.selectTab = selectTab;
wnd.saveSettings = saveSettings;
wnd.loadAllSettings = loadAllSettings;
wnd.reset = reset;
