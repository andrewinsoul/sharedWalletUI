# Shared Wallet

This React application implements the idea of a shared wallet, it is interacting with a smart contract which can be viewed in this
[repository](https://github.com/andrewinsoul/SharedWallet/blob/master/contracts/SharedWallet.sol)

## How to Test Locally

- Clone the repository using the command `git clone https://github.com/andrewinsoul/sharedWalletUI.git`

- Move into the directory with the command: `cd sharedWalletUI`

- Install packages with the command: `npm install`

- Start the development server with the command: `npm start`

##### N.B: Ensure you have the metamask extension installed in your browser

## Features

- Anybody can deposit to the wallet

- Only the wallet owner can add or remove beneficiaries

- A beneficiary can withdraw from the wallet and he is entitled to withdrawing only once per day. That means when a beneficiary withdraws, he has to wait for 24 hours before he can withdraw again.
