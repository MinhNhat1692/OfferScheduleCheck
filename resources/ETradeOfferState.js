module.exports = {
	"k_ETradeOfferStateInvalid": 1,
	"k_ETradeOfferStateActive": 2,            // This trade offer has been sent, neither party has acted on it yet.
	"k_ETradeOfferStateAccepted": 3,          // The trade offer was accepted by the recipient and items were exchanged.
	"k_ETradeOfferStateCountered": 4,         // The recipient made a counter offer
	"k_ETradeOfferStateExpired": 5,           // The trade offer was not accepted before the expiration date
	"k_ETradeOfferStateCanceled": 6,          // The sender cancelled the offer
	"k_ETradeOfferStateDeclined": 7,          // The recipient declined the offer
	"k_ETradeOfferStateInvalidItems": 8,      // Some of the items in the offer are no longer available (indicated by the missing flag in the output)
	"k_ETradeOfferStateCreatedNeedsConfirmation": 9,      // The offer hasn't been sent yet and is awaiting email confirmation
	"k_ETradeOfferStateCanceledBySecondFactor": 10     // Either party canceled the offer via email
	"k_ETradeOfferStateInEscrow": 11     // The trade has been placed on hold. The items involved in the trade have all been removed from both parties' inventories and will be automatically delivered in the future.
};
