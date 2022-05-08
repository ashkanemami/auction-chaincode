/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildCCPOrg2, buildCCPOrg3, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'basic';
const mspOrg1 = 'Org1MSP';
const walletPathOrg1 = path.join(__dirname, 'wallet', 'Org1');
const mspOrg2 = 'Org2MSP';
const walletPathOrg2 = path.join(__dirname, 'wallet', 'Org2');
const mspOrg3 = 'Org3MSP';
const walletPathOrg3 = path.join(__dirname, 'wallet', 'Org3');
const org1UserId = 'appUser1';
const org2UserId = 'appUser2';
const org3UserId = 'appUser3';

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

async function initGatewayForOrg1() {
	const ccpOrg1 = buildCCPOrg1();

	// build an instance of the fabric ca services client based on
	// the information in the network configuration
	const caOrg1Client = buildCAClient(FabricCAServices, ccpOrg1, 'ca.org1.example.com');

	// setup the wallet to hold the credentials of the application user
	const walletOrg1 = await buildWallet(Wallets, walletPathOrg1);

	// in a real application this would be done on an administrative flow, and only once
	await enrollAdmin(caOrg1Client, walletOrg1, mspOrg1);

	// in a real application this would be done only when a new user was required to be added
	// and would be part of an administrative flow
	await registerAndEnrollUser(caOrg1Client, walletOrg1, mspOrg1, org1UserId, 'org1.department1');

	// Create a new gateway instance for interacting with the fabric network.
	// In a real application this would be done as the backend server session is setup for
	// a user that has been verified.
	const gatewayOrg1 = new Gateway();
	try {
		await gatewayOrg1.connect(ccpOrg1, {
			wallet: walletOrg1,
			identity: org1UserId,
			discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
		});

		return gatewayOrg1;

	} catch (error) {
		console.error(`Error in the connecion of Org1: \n    ${error}`);
			process.exit(1);
		}

}

async function initGatewayForOrg2() {
	const ccpOrg2 = buildCCPOrg2();

	// build an instance of the fabric ca services client based on
	// the information in the network configuration
	const caOrg2Client = buildCAClient(FabricCAServices, ccpOrg2, 'ca.org2.example.com');

	// setup the wallet to hold the credentials of the application user
	const walletOrg2 = await buildWallet(Wallets, walletPathOrg2);

	// in a real application this would be done on an administrative flow, and only once
	await enrollAdmin(caOrg2Client, walletOrg2, mspOrg2);

	// in a real application this would be done only when a new user was required to be added
	// and would be part of an administrative flow
	await registerAndEnrollUser(caOrg2Client, walletOrg2, mspOrg2, org2UserId, 'org2.department1');

	// Create a new gateway instance for interacting with the fabric network.
	// In a real application this would be done as the backend server session is setup for
	// a user that has been verified.
	const gatewayOrg2 = new Gateway();
	try {
		await gatewayOrg2.connect(ccpOrg2, {
			wallet: walletOrg2,
			identity: org2UserId,
			discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
		});

		return gatewayOrg2;

	} catch (error) {
		console.error(`Error in the connecion of Org2: \n    ${error}`);
			process.exit(1);
		}

}

async function initGatewayForOrg3() {
	const ccpOrg3 = buildCCPOrg3();

	// build an instance of the fabric ca services client based on
	// the information in the network configuration
	const caOrg3Client = buildCAClient(FabricCAServices, ccpOrg3, 'ca.org3.example.com');

	// setup the wallet to hold the credentials of the application user
	const walletOrg3 = await buildWallet(Wallets, walletPathOrg3);

	// in a real application this would be done on an administrative flow, and only once
	await enrollAdmin(caOrg3Client, walletOrg3, mspOrg3);

	// in a real application this would be done only when a new user was required to be added
	// and would be part of an administrative flow
	await registerAndEnrollUser(caOrg3Client, walletOrg3, mspOrg3, org3UserId, 'org3.department1');

	// Create a new gateway instance for interacting with the fabric network.
	// In a real application this would be done as the backend server session is setup for
	// a user that has been verified.
	const gatewayOrg3 = new Gateway();
	try {
		await gatewayOrg3.connect(ccpOrg3, {
			wallet: walletOrg3,
			identity: 'admin',
			discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
		});

		return gatewayOrg3;

	} catch (error) {
		console.error(`Error in the connecion of Org3: \n    ${error}`);
			process.exit(1);
		}

}



async function addRequest(requestId, ownerId, reserveDelay, conditions, org, contract) {

	try {
		console.log(`\n--> Submit Transaction: AddRequest, creates new request with requestId, ownerId, reserveDelay and conditions arguments from organization ${org}`);
		let result = await contract.submitTransaction('AddRequest', requestId, ownerId, reserveDelay, conditions);
		console.log('*** Result: committed');
		if (`${result}` !== '') {
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);
		}
	} catch (error) {
		console.log(`*** Successfully caught the error: \n    ${error}`);
	}
}

async function getState(id, org, contract) {
	try {
		console.log(`\n--> Evaluate Transaction: GetState, function returns a request\auction with a given requestId\auctionId from organization ${org}`);
		let result = await contract.evaluateTransaction('GetState', id);
		console.log(`*** Result: ${prettyJSONString(result.toString())}`);
	} catch (error) {
		console.log(`*** Successfully caught the error: \n    ${error}`);
	}
}

async function startBidding(auctionId, requestId, org, contract) {

	try {
		console.log(`\n--> Submit Transaction: StartBidding function to start an auction with auctionId, requestId arguments from organization ${org}`);
		let result = await contract.submitTransaction('StartBidding', 'Auction004', '004');
		console.log('*** Result: committed');
		if (`${result}` !== '') {
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);
		}
	} catch (error) {
		console.log(`*** Successfully caught the error: \n    ${error}`);
	}
}

async function offer(bidPrice, delay, auctionId, org, contract) {

	try {
		console.log(`\n--> Submit Transaction: Seller Offer new cost auctionId, requestId arguments from organization ${org}`);
		let result = await contract.submitTransaction('Offer', bidPrice, delay, auctionId, org);
		console.log('*** Result: committed');
		if (`${result}` !== '') {
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);
		}
	} catch (error) {
		console.log(`*** Successfully caught the error: \n    ${error}`);
	}
}

async function closeBidding(auctionId, org, contract) {

	try {
		console.log(`\n--> Submit Transaction: CloseBidding and the winner will be indicated from organization ${org}`);
		let result = await await contract.submitTransaction('CloseBidding', auctionId);
		console.log('*** Result: committed');
		if (`${result}` !== '') {
			console.log(`*** Result: ${prettyJSONString(result.toString())}`);
		}
	} catch (error) {
		console.log(`*** Successfully caught the error: \n    ${error}`);
	}
}



async function main() {


	try {
		const gatewayOrg1 = await initGatewayForOrg1();
		const networkOrg1 = await gatewayOrg1.getNetwork(channelName);
		const contractOrg1 = networkOrg1.getContract(chaincodeName);

		const gatewayOrg2 = await initGatewayForOrg2();
		const networkOrg2 = await gatewayOrg2.getNetwork(channelName);
		const contractOrg2 = networkOrg2.getContract(chaincodeName);

		const gatewayOrg3 = await initGatewayForOrg3();
		const networkOrg3 = await gatewayOrg3.getNetwork(channelName);
		const contractOrg3 = networkOrg3.getContract(chaincodeName);

			try {

					// Now let's try to submit a transaction.
					// This will be sent to both peers and if both peers endorse the transaction, the endorsed proposal will be sent
					// to the orderer to be committed by each of the peer's to the channel ledger.
					await addRequest('004', mspOrg1, '600', '{\"storage\":3,\"processor\":\"5\,\"transmission bandwidth\":\"700\,\"networking\":\"45\"}', mspOrg1, contractOrg1);
					await getState('004', mspOrg1, contractOrg1);
					await startBidding('Auction004', '004', mspOrg1, contractOrg1);
					await getState('Auction004', mspOrg1, contractOrg1);
					await offer('200', '500', 'Auction004', mspOrg2, contractOrg2);
					await getState('Auction004', mspOrg2, contractOrg2);

					try {
						// How about we try a transactions where the executing chaincode throws an error
						// Notice how the submitTransaction will throw an error containing the error thrown by the chaincode
						await offer('300', '800', 'Auction004', mspOrg3, contractOrg3);
						console.log('******** FAILED to return an error');
					} catch (error) {
						console.log(`*** Successfully caught the error: \n    ${error}`);
					}

					await offer('150', '300', 'Auction004', mspOrg3, contractOrg3);
					await getState('Auction004', mspOrg3, contractOrg3);



					await closeBidding('Auction004', mspOrg1, contractOrg1);
					await getState('Auction004', mspOrg1, contractOrg1);
					await getState('004', mspOrg1, contractOrg1);

				} finally {
					// Disconnect from the gateway when the application is closing
					// This will close all connections to the network
					gatewayOrg1.disconnect();
					gatewayOrg2.disconnect();
					gatewayOrg3.disconnect();

				}

	} catch (error) {
			console.error('Error the setup ');
			if (error.stack) {
					console.error(error.stack);
			}
			process.exit(1);
	}


}

main();
