var OfferScheduleCheck = require('../index.js');
var ETradeOfferState = OfferScheduleCheck.ETradeOfferState;
var EOfferFilter = OfferScheduleCheck.EOfferFilter;

OfferScheduleCheck.prototype.getOffers = function(filter, historicalCutoff, callback) {
	if(typeof historicalCutoff === 'function') {
		callback = historicalCutoff;
		historicalCutoff = new Date(Date.now() + 31536000000);
	} else if(!historicalCutoff) {
		historicalCutoff = new Date(Date.now() + 31536000000);
	}
	var options = {
		"get_sent_offers": 1,
		"language": this._language,
		"active_only": (filter == EOfferFilter.ActiveOnly || filter == EOfferFilter.All) ? 1 : 0,
		"historical_only": (filter == EOfferFilter.HistoricalOnly || filter == EOfferFilter.All) ? 1 : 0,
		"time_historical_cutoff": Math.floor(historicalCutoff.getTime() / 1000)
	};
	var schedule = this;
	this._apiCall('GET', 'GetTradeOffers', 1, options, function(err, body) {
		if(err) {
			callback(err);
			return;
		}
		if(!body.response) {
			callback(new Error("Malformed API response"));
			return;
		}
		var sent = (body.response.trade_offers_sent || []).map(function(data) {
			return createOfferFromData(schedule,data);
		});
		callback(null,sent);
	});
};

function createOfferFromData(schedule,data) {
	var offer = new TradeOffer(schedule);
	offer.tradeofferid = data.tradeofferid.toString();
	offer.accountid_other = data.accountid_other.toString();
	offer.message = data.message;
	offer.expiration_time = new Date(data.expiration_time * 1000);
	offer.trade_offer_state = data.trade_offer_state;
	offer.itemsToGive = data.items_to_give || [];
	offer.itemsToReceive = data.items_to_receive || [];
	offer.is_our_offer = data.is_our_offer;
	offer.time_created = new Date(data.time_created * 1000);
	offer.time_updated = new Date(data.time_updated * 1000);
	offer.from_real_time_trade = data.from_real_time_trade;
	offer.escrow_end_date = data.escrow_end_date;
	offer.confirmation_method = data.confirmation_method;
	return offer;
}

function TradeOffer(schedule) {
	this.schedule = schedule;
	this.tradeofferid = null;
	this.accountid_other = null;
	this.message = null;
	this.expiration_time = null;
	this.trade_offer_state = ETradeOfferState.Invalid;
	this.items_to_give = [];
	this.items_to_receive = [];
	this.is_our_offer = null;
	this.time_created = null;
	this.time_updated = null;
	this.from_real_time_trade = null;
	this.escrow_end_date = null;
	this.confirmation_method = null;
}

//----------------------------------------------------------------------------------------------------
TradeOffer.prototype.data = function(key, value) {
	var pollData = this.schedule.pollData;
	//if(arguments.length < 2) {
	//	if(!this.tradeofferid) {
	//		return 0;
	//	}
	//	return pollData.offerData && pollData.offerData[this.tradeofferid] && pollData.offerData[this.tradeofferid][key];
	//} else {
		// If this is a special data key, perform necessary checks
		switch(key) {
			case 'cancelTime':
				if(!this.is_our_offer) {
					throw new Error("Cannot set cancelTime for offer #" + this.tradeofferid + " as we did not send it.");
				}

				if(this.tradeofferid && this.trade_offer_state != ETradeOfferState.Active) {
					throw new Error("Cannot set cancelTime for offer #" + this.tradeofferid + " as it is not active.");
				}

				break;
		}

		if(!this.tradeofferid) {
			return;
		}

		if(this.data(key) === value) {
			return; // Already set, nothing to do
		}

		// Make sure pollData has offerData set.
		pollData.offerData = pollData.offerData || {};
		pollData.offerData[this.id] = pollData.offerData[this.id] || {};
		pollData.offerData[this.id][key] = value;

		this.schedule.emit('pollData', pollData);
	//}
};
//-----------------------------------------------------------------------------------------------------------


TradeOffer.prototype.cancel = TradeOffer.prototype.decline = function(callback) {
	if(!this.tradeofferid) {
		return;
	}
	if(this.state != ETradeOfferState.Active) {
		return;
	}
	this.schedule._apiCall('POST', this.isOurOffer ? 'CancelTradeOffer' : 'DeclineTradeOffer', 1, {"tradeofferid": this.tradeofferid}, function(err, body) {
		if(err) {
			//Need Error here
		}	
		if(callback) {
			callback(null);
		}
		this.schedule.doPoll();
	}.bind(this));
};
