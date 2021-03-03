//Code was written using core modules as example

Module.register("mmm-uah-currency",{
	// Default module config.
	defaults: {
		apiBase: "https://bank.gov.ua/NBUStatService/",
		apiVersion: "v1",
		currencyEndpoint: "statdirectory/exchange",

		currencyCodes: ["USD", "GBP", "EUR"],

		retryDelay: 2500,
		initialLoadDelay: 0, // 0 seconds delay
		updateInterval: 60 * 60 * 6000, // every 6 hours
	},

	// Define start sequence.
	start: function () {
		Log.info("Starting module: " + this.name);

		this.currencyHtml = null;
		this.loaded = false;

		this.scheduleUpdate(this.config.initialLoadDelay);
	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");
		if (this.currencyHtml == null) {
		wrapper.innerHTML = "Loading...";
		} else {
			wrapper.innerHTML = this.currencyHtml;
		}

		wrapper.className = "dimmed light small";
		return wrapper;
	},

	updateCurrency: function () {
		var url = this.config.apiBase + this.config.apiVersion + "/" + this.config.currencyEndpoint + this.getParams();
		var self = this;

		var currencyRequest = new XMLHttpRequest();
		currencyRequest.open("GET", url, true);
		currencyRequest.onreadystatechange = function () {
			if (this.readyState === 4) {
				if (this.status === 200) {
					self.processCurrency(JSON.parse(this.response));
				} else {
					Log.error(self.name + ": Could not load currency.");
				}

				self.scheduleUpdate(self.loaded ? -1 : self.config.retryDelay);
			}
		};
		currencyRequest.send();
	},

	getParams: function () {
		var params = "?";
		params += "date=" + moment().format('YYYYMMDD');
		params += "&json";
		return params;
	},

	/* processCurrency(data)
	 * Uses the received data to set the various values.
	 *
	 * argument data object - Currency information received from bank.gov.ua
	 */
	processCurrency: function (data) {
		this.loaded = true;

		var currencyCode = this.config.currencyCode
		var currencyCodes = this.config.currencyCodes
		this.currencyHtml = "";
		currencyCodes.forEach(element => this.addCurrencyElement(element,data));
		this.updateDom();
	},

	addCurrencyElement: function (element, data) {
		this.currencyHtml += element + ": ";
		this.currencyHtml += this.roundValue(data.find(x => x.cc === element).rate) + "&nbsp&nbsp";
	},

	// /* scheduleUpdate()
	//  * Schedule next update.
	//  *
	//  * argument delay number - Milliseconds before next update. If empty, this.config.updateInterval is used.
	//  */
	scheduleUpdate: function (delay) {
		// TODO: update should be running at night once.
		var nextLoad = this.config.updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		setTimeout(function () {
			self.updateCurrency();
		}, nextLoad);
	},

	roundValue: function (num) {
		return parseFloat(num).toFixed(2);
	}

});
