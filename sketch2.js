p5.disableFriendlyErrors = true; // disables FES

let img;
let vid;
let latestPrice;
let latestDateChecked;
let trend;
let _status;

const Status = {
	Up1: 'Up1',            // 0
	Up2: 'Up2',            // 1
	Down1: 'Down1',          // 3
	Down2: 'Down2',          // 4
	twentyThousand: 'twentyThousand'  // 6
}
// Create a new canvas to the browser size
function setup() {
	noCanvas();
	background(0);
	latestPrice = parseFloat(window.localStorage.getItem('acs_price'));
	latestPrice = isNaN(latestPrice) ? 0.0 : latestPrice;
	latestDateChecked = parseInt(window.localStorage.getItem('acs_date'));
	trend = parseInt(window.localStorage.getItem('acs_trend'));
	trend = isNaN(trend) ? 0 : trend;
	_status = window.localStorage.getItem('acs_status');

	vid = createVideo("");
	vid.attribute('poster',"thumbnail.png");
	vid.size(window.innerWidth,window.innerHeight);

	const type = 'video/mp4; codecs="avc1.4D0033"';
	if( !MediaSource.isTypeSupported( type ) ) {
		throw 'Unsupported';
	}

	if(latestPrice !== 0.0) {
		let xhr = new XMLHttpRequest();
		xhr.open("GET", `https://gateway.pinata.cloud/ipfs/QmWEwuj4XEvow1HERpBCANfCphcYyEEYMWRjheg2sw4Nbu`, true);
		xhr.responseType = "blob";
		xhr.onload = function () {
			vid.src = window.URL.createObjectURL(xhr.response);
			vid.volume(0);
			vid.loop();
			vid.autoplay(true);
			if(checkUpkeep()) updatePrice(false);
		};
		xhr.send();
	} else {
		updatePrice(false);
	}
}

function draw() {
	if(checkUpkeep() && vid !== null) {
		window.navigator.onLine ? updatePrice(true) : logic(true, Math.floor(Math.random() * 5000) + 2000);
	}
}

function checkUpkeep() {
	let secondsInDay = 86400 * 1000;
	let timestamp = Date.now();
	return timestamp >= latestDateChecked + secondsInDay;
}

function logic(isUpdate, price) {
	let date = Date.now();
	let prevPrice = latestPrice;
	let secondsInDay = 86400 * 1000;

	if (price - prevPrice > 0) { // price appreciated
		let latestDateParsed = new Date(new Date(latestDateChecked).setHours(0,0,0,0));
		let dateParsed = new Date(new Date(date - secondsInDay).setHours(0,0,0,0));
		if (latestDateParsed.getTime() === dateParsed.getTime()) {
			// previous check was previous day
			trend > 0 ? trend++ : trend = 1;
		} else {
			trend = 1;
		}

		if (price >= 20000.00) {
			_status = Status.twentyThousand;
		} else if (trend >= 2) {
			_status = Status.Up2;
		} else if (trend === 1) {
			_status = Status.Up1;
		}
	} else if (price - prevPrice < 0) { // price depreciated
		let latestDateParsed = new Date(new Date(latestDateChecked).setHours(0,0,0,0));
		let dateParsed = new Date(new Date(date - secondsInDay).setHours(0,0,0,0));
		if (latestDateParsed.getTime() === dateParsed.getTime()) {
			// previous check was previous day
			trend < 0 ? trend-- : trend = -1;
		} else {
			trend = -1;
		}

		if (price >= 20000.00) {
			// 8 decimal places
			_status = Status.twentyThousand;
		} else if (trend <= -2) {
			_status = Status.Down2;
		} else if (trend === -1) {
			_status = Status.Down1;
		}
	} else if (price - prevPrice === 0) { // price static
		let latestDateParsed = new Date(new Date(latestDateChecked).setHours(0,0,0,0));
		let dateParsed = new Date(new Date(date - secondsInDay).setHours(0,0,0,0));
		if (latestDateParsed.getTime() !== dateParsed.getTime()) {
			// previous check was not previous day
			trend > 0 ? trend = 1 : trend = -1;

			if (price >= 20000.00) {
				_status = Status.twentyThousand;
			} else if (trend >= 2) {
				_status = Status.Up2;
			} else if (trend === 1) {
				_status = Status.Up1;
			} else if (trend <= -2) {
				_status = Status.Down2;
			} else if (trend === -1) {
				_status = Status.Down1;
			}
		} // else trend and _status remain unchanged
	}

	let xhr = new XMLHttpRequest();
	xhr.open("GET", `${_status}.mp4`, true);
	xhr.responseType = "blob";
	xhr.onload = function () {
		vid.src = window.URL.createObjectURL(xhr.response);
		vid.volume(0);
		vid.loop();
		vid.autoplay(true);
	};
	xhr.send();

	window.localStorage.setItem('acs_price',price.toString());
	window.localStorage.setItem('acs_date',date.toString());
	window.localStorage.setItem('acs_trend',trend.toString());
	window.localStorage.setItem('acs_status',_status);

	latestPrice = price;
	latestDateChecked = date;
}

function updatePrice(isUpdate) {
	fetch('https://api.etherscan.io/api?module=stats&action=ethprice&apikey=8NBAI3BS1GK5YVJWNMAMJY9ZAMRPE66R1Z', {
		method: 'GET', // *GET, POST, PUT, DELETE, etc.
		headers: {
			'Content-Type' : 'application/json'
		}
	}).then(function(response) {
		return response.json();
	}).then(function(data) {
		let price = parseFloat(data.result.ethusd);
		logic(isUpdate,price);
	}).catch(function(err) {
		console.log(err);
		logic(isUpdate,Math.floor(Math.random() * 5000) + 2000);
	});
}

