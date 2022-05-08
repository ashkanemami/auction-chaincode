/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

//ListingState=RequestState
// ForSale=Pending
// Sold=Finished
// AddProduct=AddRequest
// productId=requestId
// product=request
// listingId=auctionId
// productListing = requestListing
// productData = requestDetail
// listingData=auctionDetail
// memberId=sellerId
// listing = auction

const { Contract } = require('fabric-contract-api');

// predefined request states
const RequestState = {
    Pending: {code: 1, text: 'PENDING'},
    ReserveNotMet: {code: 2, text: 'RESERVE_NOT_MET'},
    Finished: {code: 3, text: 'FINISHED'},
};

class AuctionEvents extends Contract {

// "001","org1","First"
  async AddRequest(ctx, requestId, ownerId, reserveDelay, condtions) {

    let request = {
        requestId: requestId,
        ownerId: ownerId,
        winnerId: "Not Decided",
        reserveDelay: reserveDelay,
        condtions: condtions
    };

    //store request identified by requestId
    await ctx.stub.putState(requestId, Buffer.from(JSON.stringify(request)));

    // return request object
    return JSON.stringify(request);
}

// "Auction001","001"
async StartBidding(ctx, auctionId, requestId) {

    // get request
    let requestDetail = await ctx.stub.getState(requestId);
    let request;
    if (requestDetail) {
        request = JSON.parse(requestDetail.toString());
    } else {
        throw new Error('request not found');
    }
    // buyer listing identified by auctionId
    let requestListing = {
        auctionId: auctionId,
        reserveDelay: Number(request.reserveDelay),
        state: JSON.stringify(RequestState.Pending),
        requestId: requestId,
        offers: []
    };
    await ctx.stub.putState(auctionId, Buffer.from(JSON.stringify(requestListing)));

    // return request object
    return JSON.stringify(requestListing);

}
// "200","500","Auction001","org2"
async Offer(ctx, bidPrice, delay, auctionId, sellerId) {

    // get listing
    let auctionDetail = await ctx.stub.getState(auctionId);
    let auction;
    if (auctionDetail) {
        auction = JSON.parse(auctionDetail.toString());
    } else {
        throw new Error('auction not found');
    }

    // get request from the auction
    let requestDetail = await ctx.stub.getState(auction.requestId);
    let request;
    if (requestDetail) {
        request = JSON.parse(requestDetail.toString());
    } else {
        throw new Error('request not found');
    }

    // ensure valid offer
    if (auction.state !== JSON.stringify(RequestState.Pending)) {
        throw new Error('Auction is not PENDING');
    }
    if (request.reserveDelay < Number(delay)) {
        throw new Error('Delay is not less than reserve delay!');
    }

    //add offer to auction
    let offer = {
        bidPrice: Number(bidPrice),
        sellerId: sellerId
    };
    auction.offers.push(offer);
    await ctx.stub.putState(auctionId, Buffer.from(JSON.stringify(auction)));

    // return auction object
    return JSON.stringify(auction);

}

async CloseBidding(ctx, auctionId) {

    // get listing
    let auctionDetail = await ctx.stub.getState(auctionId);
    let auction;
    if (auctionDetail) {
        auction = JSON.parse(auctionDetail.toString());
    } else {
        throw new Error('auction not found');
    }

    // get request from the auction
    let requestDetail = await ctx.stub.getState(auction.requestId);
    let request;
    if (requestDetail) {
        request = JSON.parse(requestDetail.toString());
    } else {
        throw new Error('request not found');
    }

    // ensure valid auction
    if (auction.state !== JSON.stringify(RequestState.Pending)) {
        throw new Error('Auction is not PENDING');
    }

    // assign initial values
    auction.state = JSON.stringify(RequestState.ReserveNotMet);
    let originalOwner = request.winnerId;
    let lowestOffer = null;

    if(auction.offers && auction.offers.length > 0) {
        // sort the bids by bidPrice
        auction.offers.sort(function(a, b) {
          return(b.bidPrice - a.bidPrice);
        });
        lowestOffer = auction.offers[auction.offers.length - 1];

        // verify and retrieve seller with the lowest offer
        let sellerId = lowestOffer.sellerId;

        // transfer the service to the buyer
        request.winnerId = sellerId;

        await ctx.stub.putState(auction.requestId, Buffer.from(JSON.stringify(request)));

        // mark the listing as SOLD
        auction.state = JSON.stringify(RequestState.Finished);
    }

    await ctx.stub.putState(auctionId, Buffer.from(JSON.stringify(auction)));

    // return listing object
    return JSON.stringify(auction);

}

async GetState(ctx, key) {

    let data = await ctx.stub.getState(key);
    let jsonData = JSON.parse(data.toString());
    return JSON.stringify(jsonData);

}

}

module.exports = AuctionEvents;
