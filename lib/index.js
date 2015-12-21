module.exports = OfferScheduleCheck;

OfferScheduleCheck.ETradeOfferState = require('../resources/ETradeOfferState.js');
OfferScheduleCheck.EOfferFilter = require('../resources/EOfferFilter.js');
OfferScheduleCheck.EResult = require('../resources/EResult.js');
OfferScheduleCheck.ConfirmMethod - require('../resources/ConfirmMethod.js');

require('util').inherits(OfferScheduleCheck, require('events').EventEmitter);

function OfferScheduleCheck(options) {
	options = options || {};
	this._language = options.language;
	this._pollTimer = null;
	this._lastPoll = 0;
	this.pollInterval = options.pollInterval || 30000;
	this.cancelTime = options.cancelTime;
	this.pollData = {};
	this.apiKey = options.apiKey;
	
	this.doPoll();
}

function makeAnError(error, callback) {
	if(callback) {
		callback(error);
	}
}

require('./webapi.js');
require('./polling.js');
require('./classes/TradeOffer.js');
