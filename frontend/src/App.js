import { useEffect, useState } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import Connect from "./components/Connect";
import "bootstrap/dist/css/bootstrap.min.css";

import "./App.css";
import { useQuery } from "@apollo/client";
import { FETCH_MESSAGES } from "./utils/queries";
import Email from "./abi/Email.json";
import { Button, Alert, Spinner } from "react-bootstrap";
import MessageForm from "./components/MessageForm";
import { getEncryptedMessage, uploadToIPFS } from "./utils";
import Messages from "./components/Messages";
import { isValidAddress } from "ethereumjs-util";

const contractAddress = "0xd2492caeec25e931f099697b3ae1de19d187bb01";

function App() {
  const [isMetamaskConnected, setIsMetamaskConnected] = useState(false);
  const [isMetamaskInstalled, setIsMetamaskInstalled] = useState(false);
  const [address, setAddress] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isRegistered, setIsRegistered] = useState(false);
  const [formInput, setFormInput] = useState({
    address: "",
    message: "",
  });
  const [showMsgSuccess, setShowMsgSuccess] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

  const { data, loading } = useQuery(FETCH_MESSAGES, {
    variables: { to: address?.toLowerCase() },
    skip: address === null,
  });

  useEffect(() => {
    if (data) {
      setMessages(data.messages);
    }
  }, [data]);

  const checkIfRegistered = async () => {
    const { ethereum } = window;
    try {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, Email.abi, signer);
      const currentAddress = await signer.getAddress();
      const userPubKey = await contract.recievers(currentAddress);

      if (userPubKey === "0x") {
        setIsRegistered(false);
      } else {
        setIsRegistered(true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connect = async () => {
    try {
      const web3modal = new Web3Modal();
      const result = await web3modal.connect();
      if (result) {
        setIsMetamaskConnected(true);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const checkAccountConnected = async (ethereum) => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const accounts = await provider.listAccounts();
    console.log(accounts);
    if (!accounts.length) {
      setIsMetamaskConnected(false);
      return;
    }
    fetchNetworkDetails();
    setIsMetamaskConnected(true);
  };

  useEffect(() => {
    const { ethereum } = window;
    if (ethereum) {
      setIsMetamaskInstalled(true);
      checkAccountConnected(ethereum);
    } else {
      setIsMetamaskInstalled(false);
    }
  }, []);

  // Listens for network or accounts
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
      window.ethereum.on("accountsChanged", () => {
        window.location.reload();
      });
    }
  });

  const fetchNetworkDetails = async () => {
    try {
      const { ethereum } = window;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const { chainId, name } = await provider.getNetwork();
      const signer = provider.getSigner();
      const address = await signer.getAddress();

      if (chainId !== 80001) {
        alert("Please switch to matic mumbai");
      } else {
        checkIfRegistered();
      }

      setAddress(address);
    } catch (error) {
      console.log(error);
    }
  };

  const register = async () => {
    const { ethereum } = window;
    try {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const currentAddress = await signer.getAddress();

      const contract = new ethers.Contract(contractAddress, Email.abi, signer);
      const encryptionPublicKey = await ethereum.request({
        method: "eth_getEncryptionPublicKey",
        params: [currentAddress],
      });

      const tx = await contract.register(
        ethers.utils.toUtf8Bytes(encryptionPublicKey)
      );
      console.log(tx);
      await tx.wait();
      checkIfRegistered();
    } catch (error) {
      console.log(error);
    }
  };

  // const checkIfRecipientIsRegistered = async () => {
  //   const { ethereum } = window;
  //   try {
  //     console.log("Checking recipient");
  //     const provider = new ethers.providers.Web3Provider(ethereum);
  //     const signer = provider.getSigner();
  //     const contract = new ethers.Contract(contractAddress, Email.abi, signer);
  //     const isRecipientRegistered = await contract.recievers(formInput.address);
  //     return isRecipientRegistered;
  //   } catch (error) {
  //     console.log(error);
  //     return false;
  //   }
  // };

  const sendMessage = async (e) => {
    e.preventDefault();
    setShowMsgSuccess(null);
    setTxStatus(null);
    setAlertMsg(null);

    try {
      if (!isValidAddress(formInput.address)) {
        setAlertMsg("Invalid Ethereum address");
      } else {
        const { ethereum } = window;
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          contractAddress,
          Email.abi,
          signer
        );
        setTxStatus("Fetching if reciever is registered");
        let recieverPubKey = await contract.recievers(formInput.address);
        let dataToUpload = {};

        if (recieverPubKey !== "0x") {
          setTxStatus("Reciver is registered. Encrypting message!");
          recieverPubKey = ethers.utils.toUtf8String(recieverPubKey);
          const encryptedMessage = getEncryptedMessage(
            recieverPubKey,
            formInput.message
          );

          dataToUpload = {
            message: encryptedMessage,
            isEncrypted: true,
          };
        } else {
          setTxStatus("Reciver is not registered. Saving it as plain text!");
          dataToUpload = {
            message: formInput.message,
            isEncrypted: false,
          };
        }

        console.log("dataToUpload");
        console.log(dataToUpload);

        setTxStatus("Uploading data to IPFS");
        const uploadedData = await uploadToIPFS(JSON.stringify(dataToUpload));
        setTxStatus("Uploaded data to IPFS");
        const txn = await contract.sendMessage(
          formInput.address,
          ethers.utils.toUtf8Bytes(uploadedData.path)
        );
        setTxStatus("Sending txn");
        console.log(txn);
        await txn.wait();
        setTxStatus("Txn mined");
        console.log(txn);
        setShowMsgSuccess(true);
        console.log("🎉 Message sent!!!");
      }
    } catch (error) {
      if (error.code === 4001) {
        // Show alert that user declined for publicKey
        console.log("We can't encrypt anything without the key.");
      } else {
        console.error(error);
      }
    }
  };

  return (
    <div className="App">
      <h2>Email challenge</h2>

      {isMetamaskConnected && isMetamaskInstalled && (
        <>
          <MessageForm
            formInput={formInput}
            setFormInput={setFormInput}
            sendMessage={sendMessage}
          />
          {alertMsg && (
            <Alert
              variant="danger"
              style={{
                marginTop: "12px",
              }}
            >
              {alertMsg}
            </Alert>
          )}
        </>
      )}
      {showMsgSuccess ? (
        <Alert variant="success" style={{ marginTop: "16px" }}>
          🎉 Message sent successfully{" "}
        </Alert>
      ) : (
        txStatus && (
          <>
            <Spinner animation="border" />
            <span>{txStatus}</span>
          </>
        )
      )}

      {isMetamaskConnected && isMetamaskInstalled && !isRegistered && (
        <Button
          variant="primary"
          onClick={register}
          style={{
            marginTop: "16px",
          }}
        >
          Register
        </Button>
      )}

      {loading ? (
        <h3>Fetching messages...</h3>
      ) : (
        <Messages messages={messages} />
      )}

      {isMetamaskInstalled && !isMetamaskConnected && (
        <Connect connect={connect} />
      )}
    </div>
  );
}

export default App;
