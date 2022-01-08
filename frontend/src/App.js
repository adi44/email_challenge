import { useEffect, useState } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import Connect from "./components/Connect";
import "bootstrap/dist/css/bootstrap.min.css";

import "./App.css";
import { useQuery } from "@apollo/client";
import { FETCH_MESSAGES } from "./utils/queries";
import Email from "./abi/Email.json";
import { Button } from "react-bootstrap";
import MessageForm from "./components/MessageForm";
import { Buffer } from "buffer";
import { bufferToHex } from "ethereumjs-util";
import { encrypt } from "@metamask/eth-sig-util";
import { uploadToIPFS } from "./utils";
import Messages from "./components/Messages";

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
  const [userPublicKey, setUserPublicKey] = useState(null);

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
        setUserPublicKey(ethers.utils.toUtf8String(userPubKey));
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

  useEffect(() => {
    console.log("data 123");
    console.log(data);
  }, [data]);

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

  const checkIfRecipientIsRegistered = async () => {
    const { ethereum } = window;
    try {
      console.log("Checking recipient");
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, Email.abi, signer);
      const isRecipientRegistered = await contract.recievers(formInput.address);
      return isRecipientRegistered;
    } catch (error) {
      console.log(error);
      return false;
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    const { ethereum } = window;
    try {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, Email.abi, signer);
      let recieverPubKey = await contract.recievers(formInput.address);
      let dataToUpload = {};

      if (recieverPubKey !== "0x") {
        recieverPubKey = ethers.utils.toUtf8String(recieverPubKey);
        const encryptedMessage = bufferToHex(
          Buffer.from(
            JSON.stringify(
              encrypt({
                publicKey: recieverPubKey,
                data: formInput.message,
                version: "x25519-xsalsa20-poly1305",
              })
            ),
            "utf8"
          )
        );

        dataToUpload = {
          message: encryptedMessage,
          isEncrypted: true,
        };
      } else {
        dataToUpload = {
          message: formInput.message,
          isEncrypted: false,
        };
      }

      console.log("dataToUpload");
      console.log(dataToUpload);

      const uploadedData = await uploadToIPFS(JSON.stringify(dataToUpload));
      const txn = await contract.sendMessage(
        formInput.address,
        ethers.utils.toUtf8Bytes(uploadedData.path)
      );
      console.log("Sending txn");
      console.log(txn);
      await txn.wait();
      console.log("Txn mined");
      console.log(txn);

      console.log("🎉 Message sent!!!");
    } catch (error) {
      console.log(error);
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
      {loading ? (
        <h3>Fetching messages...</h3>
      ) : (
        <Messages messages={messages} />
      )}

      {isMetamaskConnected && isMetamaskInstalled && (
        <MessageForm
          formInput={formInput}
          setFormInput={setFormInput}
          sendMessage={sendMessage}
        />
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

      {isMetamaskInstalled && !isMetamaskConnected && (
        <Connect connect={connect} />
      )}
    </div>
  );
}

export default App;
