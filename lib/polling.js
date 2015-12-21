var OfferScheduleCheck = require('./index.js');
var ETradeOfferState = OfferScheduleCheck.ETradeOfferState;
var EOfferFilter = OfferScheduleCheck.EOfferFilter;
var deepEqual = require('deep-equal');
var clone = require('clone');

OfferScheduleCheck.prototype.doPoll = function() {
	if(!this.apiKey || Date.now() - this._lastPoll < 1000) {
		// Either we don't have an API key, or we last polled less than a second ago... we shouldn't spam the API
		// Reset the timer to poll one second after the last one
		this._resetPollTimer(Date.now() - this._lastPoll);
		return;
	}
	
	this._lastPoll = Date.now();
	clearTimeout(this._pollTimer);

	var offersSince = 0;
	if(this.pollData.offersSince) {
		// It looks like sometimes Steam can be dumb and backdate a modified offer. We need to handle this.
		// Let's add a 5-minute buffer.
		offersSince = this.pollData.offersSince - 300;
	}
	
	this.emit('debug', 'Doing trade offer poll since ' + offersSince);
	this.getOffers(EOfferFilter.ActiveOnly, new Date(offersSince * 1000), function(err, sent) {
		if(err) {
			this.emit('debug', "Error getting trade offers for poll: " + err.message);
			this.emit('pollFailure', err);
			this._resetPollTimer();
			return;
		}
		var origPollData = clone(this.pollData);
		var offers = this.pollData.sent || {};
		sent.forEach(function(offer) {
			if(!offers[offer.tradeofferid]) {
				this.emit('unknownOfferSent', offer);
				offers[offer.tradeofferid] = offer.trade_offer_state;
			} else if(offers[offer.tradeofferid] && offer.trade_offer_state != offers[offer.tradeofferid]) {
				// We sent this offer, and it has now changed state
				this.emit('sentOfferChanged', offer, offers[offer.tradeofferid]);
				offers[offer.tradeofferid] = offer.trade_offer_state;
			}

			if(offer.trade_offer_state == ETradeOfferState.Active && offer.is_our_offer) {
				var cancelTime = this.cancelTime;
				if(cancelTime && (Date.now() - offer.time_created.getTime() >= cancelTime)) {
					offer.cancel(function(err) {
						if(!err) {
							this.emit('sentOfferCanceled', offer);
						}
					}.bind(this));
				}
			}
			
			offers[offer.tradeofferid] = offer.trade_offer_state;
		}.bind(this));
		
		this.pollData.sent = offers;
		
		// Find the latest update time
		var latest = this.pollData.offersSince || 0;
		sent.forEach(function(offer) {
			var updated = Math.floor(offer.time_updated.getTime() / 1000);
			if(updated > latest) {
				latest = updated;
			}
		});
		
		this.pollData.offersSince = latest;
		this.emit('debug', 'Latest offer modification time is ' + latest);
		this.emit('pollSuccess');

		// If something has changed, emit the event
		if(!deepEqual(origPollData, this.pollData)) {
			this.emit('pollData', this.pollData);
		}
		
		this._resetPollTimer();
	}.bind(this));
};

OfferScheduleCheck.prototype._resetPollTimer = function(time) {
	if(time || this.pollInterval >= 1000) {
		clearTimeout(this._pollTimer);
		this._pollTimer = setTimeout(this.doPoll.bind(this), time || this.pollInterval);
	}
};
