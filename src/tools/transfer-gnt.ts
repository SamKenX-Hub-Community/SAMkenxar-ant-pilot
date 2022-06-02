import Arweave from "arweave";
import { LoggerFactory, SmartWeaveNodeFactory } from "redstone-smartweave";
import * as fs from "fs";
import { JWKInterface } from "arweave/node/lib/wallet";
import { keyfile } from "../constants";

(async () => {
  //~~~~~~~~~~~~~~~~~~~~~~~~~~UPDATE THE BELOW~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // The recipient target of the token transfer
  const target = "31LPFYoow2G7j-eSSsrIh8OlNaARZ84-80J-8ba68d8";

  // This is the Gateway Network Token Contract TX ID that will be transferred
  const gntRecordContractTxId = "lXQnhpzNXN0vthWm3sZwE2z7E_d3EWALe5lZPruCOD4";
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  // Initialize Arweave
  const arweave = Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: "https",
  });

  // Initialize `LoggerFactory`
  LoggerFactory.INST.logLevel("error");

  // Initialize SmartWeave
  const smartweave = SmartWeaveNodeFactory.memCached(arweave);

  // Get the key file used for the distribution
  const wallet: JWKInterface = JSON.parse(
    await fs.readFileSync(keyfile).toString()
  );
  const walletAddress = await arweave.wallets.jwkToAddress(wallet);

  // Read the GNT Registry Contract
  console.log(
    "Transfering %s GNT from %s to %s",
    gntRecordContractTxId,
    walletAddress,
    target
  );
  const pst = smartweave.pst(gntRecordContractTxId);
  pst.connect(wallet);
  await pst.transfer({
    target,
    qty: 1,
  });

  console.log("Finished transferring tokens");
})();
