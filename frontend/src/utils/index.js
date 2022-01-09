import { create as ipfsHttpClient } from "ipfs-http-client";
import axios from "axios";
import { bufferToHex } from "ethereumjs-util";
import { encrypt } from "@metamask/eth-sig-util";
import { Buffer } from "buffer";

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

const IPFS_URL = "https://ipfs.io/ipfs/";

const uploadToIPFS = async (data) => {
  const added = await client.add(data, {
    progress: (prog) => console.log(`received: ${prog}`),
  });

  return added;
};

const fetchFromIPFS = async (path) => {
  try {
    const res = await axios.get(IPFS_URL + path);
    return res.data;
  } catch (error) {
    console.log(error);
  }
};

const getEncryptedMessage = (publicKey, message) => {
  try {
    const encryptedMessage = bufferToHex(
      Buffer.from(
        JSON.stringify(
          encrypt({
            publicKey: publicKey,
            data: message,
            version: "x25519-xsalsa20-poly1305",
          })
        ),
        "utf8"
      )
    );
    return encryptedMessage;
  } catch (error) {
    console.log("Error occured while encrypting message");
    console.log(error);
  }
};

export { uploadToIPFS, fetchFromIPFS, getEncryptedMessage };
