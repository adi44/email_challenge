import { create as ipfsHttpClient } from "ipfs-http-client";

const client = ipfsHttpClient("https://ipfs.infura.io:5001/api/v0");

const uploadToIPFS = async (data) => {
  const added = await client.add(data, {
    progress: (prog) => console.log(`received: ${prog}`),
  });

  return added;
};

export { uploadToIPFS };
