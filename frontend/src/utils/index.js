import { create as ipfsHttpClient } from "ipfs-http-client";
import axios from "axios";

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

export { uploadToIPFS, fetchFromIPFS };
