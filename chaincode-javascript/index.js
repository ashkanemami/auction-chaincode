/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const auction = require('./lib/auction');

module.exports.AuctionEvents = auction;
module.exports.contracts = [auction];
