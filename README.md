# Shared Wallet

This React application implements the idea of a shared wallet, it is interacting with a smart contract which can be viewed in this
[repository](https://github.com/andrewinsoul/SharedWallet/blob/master/contracts/SharedWallet.sol). The idea of the shared wallet is to cultivate the idea of saving in crypto which is very beneficial on the long run.

## How to Test Locally

- Clone the respository of the smart contract that this app is interacting with using the command `git clone https://github.com/andrewinsoul/sharedWallet.git`

- Follow the repo's ReadME and start the node

- Clone the repository using the command `git clone https://github.com/andrewinsoul/sharedWalletUI.git`

- Move into the directory with the command: `cd sharedWalletUI`

- Install packages with the command: `npm install`

- Start the development server with the command: `npm start`

##### N.B: Ensure you have the metamask extension installed in your browser

## Features

- Anybody can deposit to the wallet. Once you deposit into the wallet, you automatically become a beneficiary.
  It should be noted that 0.03 ETH is subtracted from your first deposit into the wallet and this is the minimal you can deposit for your first time.

- Only beneficiaries (people who have deposited) can withdraw from the wallet

- A beneficiary can withdraw from the wallet when he has at least 0.5 ETH deposit in the shared wallet and his last time of withdrawal is more than a month. That means in a month, you can only withdraw once.

- Only the owner of the shared wallet has access to the 0.03 ETH that is subtracted from every beneficiary the first time they deposit into the wallet.

## Deployment

You can check out the deployed DApp [here](https://nimble-jelly-d1c323.netlify.app/) ✨✨
