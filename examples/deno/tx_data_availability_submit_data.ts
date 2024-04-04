/// The example showcases how to programmatically do data submission. 
///
/// The following transactions are being called:
///   DataAvailability.submitData
///

import { ApiPromise, Keyring, WsProvider } from "https://deno.land/x/polkadot@0.2.45/api/mod.ts";
import { ISubmittableResult } from "https://deno.land/x/polkadot@0.2.45/types/types/extrinsic.ts";
import { H256 } from "https://deno.land/x/polkadot@0.2.45/types/interfaces/types.ts";
import { API_EXTENSIONS, API_RPC, API_TYPES } from "./api_options.ts";

const api = await ApiPromise.create({
  provider: new WsProvider("ws://127.0.0.1:9944"),
  rpc: API_RPC,
  types: API_TYPES,
  signedExtensions: API_EXTENSIONS,
});

// Use your secret seed or mnemonic here
const account = new Keyring({ type: "sr25519" }).addFromUri("//Alice");

// Transaction call
// Change "Hello World" to something that has meaning to you
const data = "Hello World";
const tx_result = await new Promise<ISubmittableResult>((res, _) => {
  api.tx.dataAvailability.submitData(data).signAndSend(account, (result: ISubmittableResult) => {
      console.log(`Tx status: ${result.status}`);
      if (result.isFinalized || result.isError) {
        res(result);
      }
    },
  );
});

// Rejected Transaction handling
if (tx_result.isError) {
  console.log(`Transaction was not executed`);
  Deno.exit(0);
} 

const [tx_hash, block_hash] = [tx_result.txHash as H256, tx_result.status.asFinalized as H256];
console.log(`Tx Hash: ${tx_hash}, Block Hash: ${block_hash}`);

// Failed Transaction handling
const error = tx_result.dispatchError;
if (error != undefined) {
  if (error.isModule) {
    const decoded = api.registry.findMetaError(error.asModule);
    const { docs, name, section } = decoded;
    console.log(`${section}.${name}: ${docs.join(' ')}`);
  } else {
    console.log(error.toString());
  }
  Deno.exit(0);
}

// Extracting data
const block = await api.rpc.chain.getBlock(block_hash);
const tx = block.block.extrinsics.find((tx) => tx.hash.toHex() == tx_hash.toHex());
if (tx == undefined) {
  console.log("Failed to find the Submit Data transaction");
  Deno.exit(0);
}

console.log(tx.toHuman());
const dataHex = tx.method.args.map((a) => a.toString()).join(", ");
// Data retrieved from the extrinsic data
let str = "";
for (let n = 0; n < dataHex.length; n += 2) {
  str += String.fromCharCode(parseInt(dataHex.substring(n, n + 2), 16));
}
console.log(`submitted data: ${str}`);

Deno.exit(0);