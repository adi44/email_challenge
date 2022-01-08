import { useState } from "react";
import { Card, Button } from "react-bootstrap";
import moment from "moment";
import { ethers } from "ethers";
import { fetchFromIPFS } from "../utils";

import Email from "../abi/Email.json";

const contractAddress = "0xd2492caeec25e931f099697b3ae1de19d187bb01";

const Message = ({ message }) => {
  const [text, setText] = useState(null);

  const decryptMessage = async (encryptedMessage) => {
    console.log("encryptedMessage");
    console.log(encryptedMessage);
    const { ethereum } = window;
    try {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const currentAddress = await signer.getAddress();
      const decryptedMessage = await ethereum.request({
        method: "eth_decrypt",
        params: [encryptedMessage, currentAddress],
      });

      setText(decryptedMessage);
    } catch (error) {
      console.log(error);
    }
  };

  const openMessage = async () => {
    try {
      const path = ethers.utils.toUtf8String(message.data);
      const messageData = await fetchFromIPFS(path);
      if (messageData.isEncrypted) {
        console.log("Need to decrypt message");
        console.log(messageData.message);
        decryptMessage(messageData.message);
      } else {
        console.log(messageData.message);
        setText(messageData.message);
      }
    } catch (error) {
      console.log("Error occured while opening message");
      console.log(error);
    }
  };

  return (
    <div className="message">
      <Card>
        <Card.Body>
          <Card.Text>From: {message.from}</Card.Text>
          <Card.Title>{text}</Card.Title>
          <Card.Text>
            On:
            {moment.unix(message.timestamp).format("MMM-DD-YYYY hh:mm:ss A")}(
            {moment(message.timestamp * 1000).fromNow()})
          </Card.Text>
          <Button onClick={openMessage} disabled={text !== null}>
            Open Message
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Message;
