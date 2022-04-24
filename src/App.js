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
    beneficiaryAddressToAdd: "",
    beneficiaryAddressToRemove: "",
  });
  const [sharedWalletOwnerAddress, setSharedWalletOwnerAddress] =
    useState(null);
  const [customerTotalBalance, setCustomerTotalBalance] = useState(null);
  const [customerAddress, setCustomerAddress] = useState(null);
  const [sharedWalletBalance, setSharedWalletBalance] = useState(0);
  const [withdrawing, setWithdrawing] = useState(false);
  const [addingBeneficiary, setAddingBeneficiary] = useState(false);
  const [removingBeneficiary, setRemovingBeneficiary] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalHeader, setModalHeader] = useState("");
  const [modalBody, setModalBody] = useState("");
  const [modalType, setModalType] = useState("error"); // could either be error or success

  const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;
  const contractABI = abi.abi;

  const displayError = (errorHeader, errorBody = "An error occured") => {
    setModalType("error");
    setShowModal(true);
    setModalHeader(errorHeader);
    setModalBody(errorBody);
  };

  const displaySuccess = (
    header = "Transaction Success",
    body = "Your transaction was successful"
  ) => {
    setModalType("success");
    setShowModal(true);
    setModalHeader(header);
    setModalBody(body);
  };

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
        (error.error && formatContractError(error.error.message)) ||
        error.message ||
        "An error occured";
      const errorHeader = "Transaction Error";
      return { errorBody, errorHeader, success: false };
    }
  };

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
        (error.error && formatContractError(error.error.message)) ||
        error.message ||
        "An error occured";
      displayError("Transaction Error", errorBody);
    }
  };

  const addBeneficiary = async () => {
    if (!inputValue.beneficiaryAddressToAdd) {
      displayError("Error", "Please enter beneficiary address");
      return;
    }
    setAddingBeneficiary(true);
    try {
      const { sharedWalletContract } = await getSharedWalletContract();
      const txn = await sharedWalletContract.addBeneficiary(
        inputValue.beneficiaryAddressToAdd
      );
      console.log("Setting Beneficiaey Address...");
      await txn.wait();
      console.log("Beneficiary Address Changed", txn.hash);
      checkEvents(
        sharedWalletContract,
        async (sharedWalletOwner, timestamp) => {
          displaySuccess("Succes", "Beneficiary Successfully Added");
          setAddingBeneficiary(false);
          console.log(
            `shared wallet owner: ${sharedWalletOwner}\n timestamp: ${timestamp}`
          );
        },
        "AddBeneficiaryEvent"
      );
    } catch (error) {
      setAddingBeneficiary(false);
      const errorBody =
        (error.error && formatContractError(error.error.message)) ||
        error.message ||
        "An error occured";
      displayError("Transaction Error", errorBody);
    }
  };

  const removeBeneficiary = async () => {
    if (!inputValue.beneficiaryAddressToRemove) {
      displayError("Error", "Please enter beneficiary address");
      return;
    }
    setRemovingBeneficiary(true);
    try {
      const { sharedWalletContract } = await getSharedWalletContract();
      const txn = await sharedWalletContract.removeBeneficiary(
        inputValue.beneficiaryAddressToRemove
      );
      await txn.wait();
      checkEvents(
        sharedWalletContract,
        async (sharedWalletOwner, timestamp) => {
          displaySuccess("Success", "Beneficiary Successfully Removed");
          setRemovingBeneficiary(false);
          console.log(
            `shared wallet owner: ${sharedWalletOwner}\n timestamp: ${timestamp}`
          );
        },
        "RemoveBeneficiaryEvent"
      );
    } catch (error) {
      setRemovingBeneficiary(false);
      const errorBody =
        (error.error && formatContractError(error.error.message)) ||
        error.message ||
        "An error occured";
      displayError("Transaction Error", errorBody);
    }
  };

  const formatContractError = (errorMsg) => {
    return errorMsg.split(":")[1];
  };

  const getSharedWalletOwnerHandler = async () => {
    try {
      const { sharedWalletContract } = await getSharedWalletContract(true);
      return sharedWalletContract.getSharedWalletOwnerAddress();
    } catch (error) {
      const errorBody =
        (error.error && formatContractError(error.error.message)) ||
        error.message ||
        "An error occured";
      displayError("Transaction Error", errorBody);
    }
  };

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
        (error.error && formatContractError(error.error.message)) ||
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

  const deposityMoneyHandler = async () => {
    if (!inputValue.deposit) {
      displayError("Error", "Please enter amount to deposit");
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
      checkEvents(sharedWalletContract, async (from, to, amount) => {
        const balances = await Promise.all([
          customerBalanceHandler(),
          getSharedWalletBalance(),
        ]);
        const [customerBalance, sharedWalletBalance] = balances;
        setCustomerTotalBalance(`${customerBalance} ETH`);
        setSharedWalletBalance(`${sharedWalletBalance} ETH`);
        displaySuccess();
        setDepositing(false);
        console.log(`from: ${from} \nto: ${to}\n amount: ${amount.toString()}`);
      });
    } catch (error) {
      setDepositing(false);
      const errorBody =
        (error.error && formatContractError(error.error.message)) ||
        error.message ||
        "An error occured";
      displayError("Transaction Error", errorBody);
    }
  };

  const withDrawMoneyHandler = async () => {
    if (!inputValue.withdraw) {
      displayError("Error", "Please enter amount to withdraw");
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
      checkEvents(sharedWalletContract, async (from, to, amount) => {
        const balances = await Promise.all([
          customerBalanceHandler(),
          getSharedWalletBalance(),
        ]);
        const [customerBalance, sharedWalletBalance] = balances;
        setCustomerTotalBalance(customerBalance);
        setSharedWalletBalance(sharedWalletBalance);
        displaySuccess();
        setWithdrawing(false);
        console.log(`from: ${from} to: ${to} amount: ${amount.toString()}`);
      });
    } catch (error) {
      setWithdrawing(false);
      const errorBody =
        (error.error && formatContractError(error.error.message)) ||
        error.message ||
        "An error occured";
      displayError("Transaction Error", errorBody);
    }
  };

  const handleInputChange = (event) => {
    setInputValue((prevFormData) => ({
      ...prevFormData,
      [event.target.name]: event.target.value,
    }));
  };

  const checkEvents = (
    sharedWalletContract,
    callBackFn,
    nameOfEvent = "Transfer"
  ) => {
    sharedWalletContract.on(nameOfEvent, callBackFn);
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const isWalletConnectedRes = await checkIfWalletIsConnected();
        const { success, errorBody, errorHeader } = isWalletConnectedRes;
        console.log(success, errorBody, errorHeader);
        if (success) {
          const res = await Promise.all([
            getSharedWalletBalance(),
            getSharedWalletOwnerHandler(),
            customerBalanceHandler(),
          ]);
          let [sharedWalletBalance, owner, balance] = res;
          setSharedWalletBalance(sharedWalletBalance);
          setSharedWalletOwnerAddress(owner);

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
      }
    };
    fetch();
  }, [isWalletConnected]);

  return (
    <>
      <main
        className={
          showModal
            ? "main-container pointer-events-none opacity-95"
            : "main-container "
        }
      >
        <h2 className="headline">
          <div>
            <span className="headline-gradient">SharedWallet </span>
            💰
          </div>
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
              <div className="form-style w-full sm:w-1/2">
                <div className="w-full">
                  <input
                    type="text"
                    className="input-style w-full text-sm"
                    onChange={handleInputChange}
                    name="beneficiaryAddressToAdd"
                    placeholder="Enter Wallet Address of Beneficiary"
                    value={inputValue.beneficiaryAddressToAdd}
                  />
                  <button
                    className="btn-grey w-full mt-4"
                    onClick={addBeneficiary}
                  >
                    Add Beneficiary
                    <Loader loading={addingBeneficiary} classStyle="ml-4" />
                  </button>
                </div>
              </div>

              <div className="form-style w-full sm:w-1/2 mt-10 sm:mt-0">
                <div className="w-full">
                  <input
                    type="text"
                    className="input-style w-full text-sm"
                    onChange={handleInputChange}
                    name="beneficiaryAddressToRemove"
                    placeholder="Enter Wallet Address of Beneficiary"
                    value={inputValue.beneficiaryAddressToRemove}
                  />
                  <button
                    className="btn-grey w-full mt-4"
                    onClick={removeBeneficiary}
                  >
                    Remove Beneficiary
                    <Loader loading={removingBeneficiary} classStyle="ml-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>
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
