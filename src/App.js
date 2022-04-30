/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import Loader from "./components/Loader";
import abi from "./contract/SharedWallet.json";
import { Modal } from "./components/Modal";

const App = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [issharedWalletOwner, setIsSharedWalletOwner] = useState(false);
  const [inputValue, setInputValue] = useState({
    withdraw: "",
    deposit: "",
    withdrawProfit: "",
  });
  const [sharedWalletOwnerAddress, setSharedWalletOwnerAddress] =
    useState(null);
  const [customerTotalBalance, setCustomerTotalBalance] = useState(null);
  const [customerAddress, setCustomerAddress] = useState(null);
  const [sharedWalletBalance, setSharedWalletBalance] = useState(0);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawingProfit, setWithdrawingProfit] = useState(false);
  const [appLoading, setAppLoading] = useState(false);
  const [myProfit, setMyProfit] = useState(0);
  const [depositing, setDepositing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalHeader, setModalHeader] = useState("");
  const [modalBody, setModalBody] = useState("");
  const [modalType, setModalType] = useState("error"); // could either be error or success

  const contractAddress =
    process.env.REACT_APP_CONTRACT_ADDRESS ||
    "0xaA4B750e53A54E7D85389F36A1d92b86e9954b46";
  const { abi: contractABI } = abi;

  /**
   * @description: This function displays the error modal with heading and body when an error occurs in any operation
   * @param {String} errorHeader - The error heading that will be displayed in the error modal
   * @param {String} errorBody - The error body that wil be displayed in the error modal
   */
  const displayError = (errorHeader, errorBody = "An error occured") => {
    setModalType("error");
    setShowModal(true);
    setModalHeader(errorHeader);
    setModalBody(errorBody);
  };

  /**
   * @description: This function displays the success modal with heading and body when an operation is successful
   * @param {String} header - The heading that will be displayed in the success modal
   * @param {String} body - The body that wil be displayed in the success modal
   */
  const displaySuccess = (
    header = "Transaction Success",
    body = "Your transaction was successful"
  ) => {
    setModalType("success");
    setShowModal(true);
    setModalHeader(header);
    setModalBody(body);
  };

  /**
   * @description - The function checks if the client has connected his wallet with Metamask
   * @returns {Object} - either {success: true} or {success: false}
   */
  const checkIfWalletIsConnected = async () => {
    try {
      if (window.ethereum) {
        const [account] = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setIsWalletConnected(true);
        setCustomerAddress(account);
        console.log("Account Connected: ", account);
        return { success: true };
      } else {
        const errorBody = "Install Metamask to use our crypto bank...";
        const errorHeader = "Metamask not installed";
        return { errorBody, errorHeader, success: false };
      }
    } catch (error) {
      const errorBody =
        (error.error && error.error.message) ||
        error.message ||
        "An error occured";
      const errorHeader = "Transaction Error";
      return { errorBody, errorHeader, success: false };
    }
  };

  /**
   * @description - It calls the contract function that returns the balance in the shared wallet
   * @returns {String} - returns the value of the shared wallet balance formatted with the ether unit
   */
  const getSharedWalletBalance = async () => {
    try {
      const { sharedWalletContract } = await getSharedWalletContract(true);
      let sharedWalletBal = await sharedWalletContract.getWalletBalance();
      sharedWalletBal = `${Number(
        ethers.utils.formatEther(sharedWalletBal)
      ).toFixed(4)} ETH`;
      return sharedWalletBal;
    } catch (error) {
      const errorBody =
        (error.error && error.error.message) ||
        error.message ||
        "An error occured";
      displayError("Transaction Error", errorBody);
    }
  };

  /**
   * @description - It calls the contract function that returns the address of the shared wallet owner
   * @returns {String} - returns the address of the shared wallet owner
   */
  const getSharedWalletOwnerHandler = async () => {
    try {
      const { sharedWalletContract } = await getSharedWalletContract(true);
      return sharedWalletContract.getSharedWalletOwnerAddress();
    } catch (error) {
      const errorBody =
        (error.error && error.error.message) ||
        error.message ||
        "An error occured";
      displayError("Transaction Error", errorBody);
    }
  };

  /**
   * @description - It calls the contract function that returns the profit of the shared wallet owner
   * @returns {Number} - returns the profit of the shared wallet owner
   */
  const getMyProfit = async () => {
    try {
      const { sharedWalletContract } = await getSharedWalletContract(true);
      let ownerProfit = await sharedWalletContract.retrieveSharedWalletProfit();
      ownerProfit = `${Number(ethers.utils.formatEther(ownerProfit)).toFixed(
        4
      )} ETH`;
      return ownerProfit;
    } catch (error) {
      const errorBody =
        (error.error && error.error.message) ||
        error.message ||
        "An error occured";
      displayError("Transaction Error", errorBody);
    }
  };

  /**
   * @description - It calls the contract function that returns the balance in the customer wallet
   * @returns {String} - returns the value of the connected wallet formatted with the ether unit
   */
  const customerBalanceHandler = async () => {
    try {
      const { provider } = await getSharedWalletContract(true);
      let balance =
        customerAddress && (await provider.getBalance(customerAddress));

      return (
        balance && `${Number(ethers.utils.formatEther(balance)).toFixed(4)} ETH`
      );
    } catch (error) {
      const errorBody =
        (error.error && error.error.message) ||
        error.message ||
        "An error occured";
      displayError("Transaction Error", errorBody);
    }
  };

  /**
   * @description - gets the contract, the provider and the signer
   * @param {Boolean} shouldUseProvider - An argument that controls whether to use the provider or the signer (We use the provider if the transaction is not going to change state but the signer is used if there will be a state change in the transaction)
   * @returns {Object} - Returns an object with the contract, the provider and the signer
   */
  const getSharedWalletContract = async (shouldUseProvider = false) => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const sharedWalletContract = new ethers.Contract(
          contractAddress,
          contractABI,
          shouldUseProvider ? provider : signer
        );
        return { sharedWalletContract, provider, signer };
      } else {
        const errorBody = "Install Metamask to use our crypto bank...";
        displayError("Metamask not installed", errorBody);
      }
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description - It calls the contract function that deposits funds to the shared wallet
   */
  const deposityMoneyHandler = async () => {
    const isValid = validateInput("deposit");
    if (!isValid) {
      return;
    }
    setDepositing(true);
    try {
      const { sharedWalletContract } = await getSharedWalletContract();
      const txn = await sharedWalletContract.deposit({
        value: ethers.utils.parseEther(inputValue.deposit),
      });
      console.log("Deposting money...");
      await txn.wait();
      checkEvents(
        sharedWalletContract,
        async (from, to, amount) => {
          const balances = await Promise.all([
            customerBalanceHandler(),
            getSharedWalletBalance(),
          ]);
          const [customerBalance, sharedWalletBalance] = balances;
          setCustomerTotalBalance(customerBalance);
          setSharedWalletBalance(sharedWalletBalance);
          displaySuccess();
          setInputValue((prevFormData) => ({
            ...prevFormData,
            deposit: "",
          }));
          setDepositing(false);
          console.log(
            `from: ${from} \nto: ${to}\n amount: ${amount.toString()}`
          );
        },
        "DepositTransferEvent"
      );
    } catch (error) {
      setDepositing(false);
      const errorBody =
        (error.error && error.error.message) ||
        error.message ||
        "An error occured";
      displayError("Transaction Error", errorBody);
    }
  };

  /**
   * @description - It calls the contract function that withdraws funds from the shared wallet
   */
  const withDrawMoneyHandler = async () => {
    const isValid = validateInput("withdraw");
    if (!isValid) {
      return;
    }
    setWithdrawing(true);
    try {
      const { sharedWalletContract, signer } = await getSharedWalletContract();
      const myAddress = await signer.getAddress();
      console.log("provider signer...", myAddress);
      const txn = await sharedWalletContract.withdraw(
        ethers.utils.parseEther(inputValue.withdraw)
      );
      console.log("Withdrawing money...");
      await txn.wait();
      checkEvents(
        sharedWalletContract,
        async (from, to, amount) => {
          const balances = await Promise.all([
            customerBalanceHandler(),
            getSharedWalletBalance(),
          ]);
          const [customerBalance, sharedWalletBalance] = balances;
          setCustomerTotalBalance(customerBalance);
          setSharedWalletBalance(sharedWalletBalance);
          displaySuccess();
          setInputValue((prevFormData) => ({
            ...prevFormData,
            withdraw: "",
          }));
          setWithdrawing(false);
          console.log(`from: ${from} to: ${to} amount: ${amount.toString()}`);
        },
        "WithdrawTransferEvent"
      );
    } catch (error) {
      setWithdrawing(false);
      const errorBody =
        (error.error && error.error.message) ||
        error.message ||
        "An error occured";
      displayError("Transaction Error", errorBody);
    }
  };

  const validateInput = (name) => {
    if (!inputValue[name]) {
      displayError("Error", "Please enter amount");
      setDepositing(false);
      setWithdrawing(false);
      setWithdrawingProfit(false);
      return false;
    }
    if (isNaN(Number(inputValue[name]))) {
      displayError("Error", `Please enter a valid amount`);
      setDepositing(false);
      setWithdrawing(false);
      setWithdrawingProfit(false);
      return false;
    }
    return true;
  };

  /**
   * @description - It calls the contract function that withdraws funds from the shared wallet
   */
  const withDrawProfitHandler = async () => {
    const isValid = validateInput("withdrawProfit");
    if (!isValid) {
      return;
    }
    setWithdrawingProfit(true);
    try {
      const { sharedWalletContract, signer } = await getSharedWalletContract();
      const myAddress = await signer.getAddress();
      console.log("provider signer...", myAddress);
      const txn = await sharedWalletContract.withdrawMyProfit(
        ethers.utils.parseEther(inputValue.withdrawProfit)
      );
      console.log("Withdrawing money...");
      await txn.wait();
      checkEvents(
        sharedWalletContract,
        async (from, to, amount) => {
          const balances = await Promise.all([
            customerBalanceHandler(),
            getSharedWalletBalance(),
            getMyProfit(),
          ]);
          const [customerBalance, sharedWalletBalance, myProfit] = balances;
          setCustomerTotalBalance(customerBalance);
          setSharedWalletBalance(sharedWalletBalance);
          setMyProfit(myProfit);
          setInputValue((prevFormData) => ({
            ...prevFormData,
            withdrawProfit: "",
          }));
          displaySuccess();
          setWithdrawingProfit(false);
          console.log(`from: ${from} to: ${to} amount: ${amount.toString()}`);
        },
        "WithdrawProfitTransferEvent"
      );
    } catch (error) {
      setWithdrawingProfit(false);
      const errorBody =
        (error.error && error.error.message) ||
        error.message ||
        "An error occured";
      displayError("Transaction Error", errorBody);
    }
  };

  /**
   * @description - It handles the input change
   * @param {Object} event
   */
  const handleInputChange = (event) => {
    setInputValue((prevFormData) => ({
      ...prevFormData,
      [event.target.name]: event.target.value,
    }));
  };

  /**
   * @description - Handles logic based on the event emitted by the smart contract
   * @param {Object} sharedWalletContract - The contract object
   * @param {Function} callBackFn - the function that is executed when the smart contract emits an event
   * @param {String} nameOfEvent - the event name
   */
  const checkEvents = (sharedWalletContract, callBackFn, nameOfEvent) => {
    sharedWalletContract.on(nameOfEvent, callBackFn);
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        setAppLoading(true);
        const isWalletConnectedRes = await checkIfWalletIsConnected();
        const { success, errorBody, errorHeader } = isWalletConnectedRes;
        console.log(success, errorBody, errorHeader);
        if (success) {
          const res = await Promise.all([
            getSharedWalletBalance(),
            getSharedWalletOwnerHandler(),
            customerBalanceHandler(),
            getMyProfit(),
          ]);
          let [sharedWalletBalance, owner, balance, ownerProfit] = res;
          setSharedWalletBalance(sharedWalletBalance);
          setSharedWalletOwnerAddress(owner);
          setMyProfit(ownerProfit);

          const [account] = await window.ethereum.request({
            method: "eth_requestAccounts",
          });

          if (owner.toLowerCase() === account.toLowerCase()) {
            setIsSharedWalletOwner(true);
          } else {
            setIsSharedWalletOwner(false);
          }
          setCustomerTotalBalance(balance);
          console.log("Retrieved balance...", balance);
        } else {
          displayError(errorHeader, errorBody);
        }
      } catch (err) {
        displayError("Error", "An error occured while loading the app");
      } finally {
        setAppLoading(false);
      }
    };
    fetch();
  }, [isWalletConnected]);

  return (
    <>
      <main
        className={
          showModal
            ? "main-container pointer-events-none opacity-20"
            : "main-container "
        }
      >
        {appLoading ? (
          <div className="flex justify-center items-center">
            <p className="my-12">Loading...</p>
          </div>
        ) : (
          <>
            <h2 className="headline">
              <div>
                <span className="headline-gradient">SharedWallet </span>
                💰
              </div>
              {issharedWalletOwner && (
                <span className="headline-gradient">
                  {`My Profit: ${myProfit}`}
                </span>
              )}
              <span className="headline-gradient">
                {`Shared Wallet Balance: ${sharedWalletBalance}`}
              </span>
            </h2>
            <section className="customer-section px-10 pt-5 pb-10 flex flex-col sm:flex-row flex-wrap">
              <div className="mt-7 mb-9 w-full sm:w-1/2 flex flex-col sm:flex-row">
                <div className="form-style w-full mr-4">
                  <input
                    type="text"
                    className="input-style"
                    onChange={handleInputChange}
                    name="deposit"
                    placeholder="0.0000 ETH"
                    value={inputValue.deposit}
                  />
                  <button className="btn-purple" onClick={deposityMoneyHandler}>
                    Deposit Money To Wallet (In ETH)
                    <Loader classStyle="ml-4" loading={depositing} />
                  </button>
                </div>
              </div>
              <div className="mt-7 mb-9 w-full sm:w-1/2 flex flex-col sm:flex-row">
                <div className="form-style w-full">
                  <input
                    type="text"
                    className="input-style"
                    onChange={handleInputChange}
                    name="withdraw"
                    placeholder="0.0000 ETH"
                    value={inputValue.withdraw}
                  />
                  <button className="btn-purple" onClick={withDrawMoneyHandler}>
                    Withdraw Money from Wallet (In ETH)
                    <Loader classStyle="ml-4" loading={withdrawing} />
                  </button>
                </div>
              </div>
              <div>
                <div className="mt-5">
                  <p>
                    <span className="font-bold">Customer Balance: </span>
                    {customerTotalBalance}
                  </p>
                </div>
                <div className="mt-5">
                  <p>
                    <span className="font-bold">WalletOwner Address: </span>
                    {sharedWalletOwnerAddress}
                  </p>
                </div>
                <div className="mt-5">
                  {isWalletConnected && (
                    <p>
                      <span className="font-bold">Your Wallet Address: </span>
                      {customerAddress}
                    </p>
                  )}
                  <button
                    className="btn-connect"
                    onClick={checkIfWalletIsConnected}
                  >
                    {isWalletConnected
                      ? "Wallet Connected 🔒"
                      : "Connect Wallet 🔑"}
                  </button>
                </div>
              </div>
            </section>
            {issharedWalletOwner && (
              <section className="bank-owner-section">
                <h2 className="text-xl border-b-2 border-indigo-500 px-10 py-4 font-bold">
                  Shared Wallet Owner Admin Panel
                </h2>
                <div className="p-2 sm:p-10 flex flex-col sm:flex-row">
                  <div className="form-style w-full">
                    <div className="w-full">
                      <input
                        type="text"
                        className="input-style w-full text-sm"
                        onChange={handleInputChange}
                        name="withdrawProfit"
                        placeholder="Enter Amount"
                        value={inputValue.withdrawProfit}
                      />
                      <button
                        className="btn-grey w-full"
                        onClick={withDrawProfitHandler}
                      >
                        Withdraw Profit
                        <Loader loading={withdrawingProfit} classStyle="ml-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Modal
        type={modalType}
        showModal={showModal}
        modalHeader={modalHeader}
        setShowModal={setShowModal}
        modalBody={modalBody}
        modalFooterBtnText={modalHeader === "Error" ? "Close" : "Ok"}
      />
    </>
  );
};
export default App;
