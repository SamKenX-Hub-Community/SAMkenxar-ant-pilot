import Arweave from "arweave";
import { LoggerFactory, WarpNodeFactory } from "warp-contracts";
import * as fs from "fs";
import { JWKInterface } from "arweave/node/lib/wallet";
import { deployedContracts } from "../deployed-contracts";
import { keyfile } from "../constants";

(async () => {
  //~~~~~~~~~~~~~~~~~~~~~~~~~~UPDATE THE BELOW~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // A short token symbol, typically with ANT- in front
  const ticker = "ANT-NOSFERATU";

  // A friendly name for the name of this ANT
  const name = "Nosferatu";

  // This is the name that will be purchased in the Arweave Name System Registry
  const nameToBuy = "nosferatu";

  // The arweave data transaction added to the ANT that is to be proxied using the registered name
  const dataPointer = "CJ-3DbCHny8rbMCi4LyBmWbYEBGOgW-XXFw7RrXz-FM";

  // This is the production ArNS Registry Smartweave Contract
  const arnsRegistryContractTxId = "bLAgYxAdX2Ry-nt6aH2ixgvJXbpsEYm28NgJgyqfs-U";
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


  // This is the ANT Smartweave Contract Source TX ID that will be used to create the new ANT
  const antRecordContractTxId = deployedContracts.sourceTxId;

  // Initialize Arweave
  const arweave = Arweave.init({
    host: "arweave.net",
    port: 443,
    protocol: "https",
  });

  // Initialize `LoggerFactory`
  LoggerFactory.INST.logLevel("error");

  // Initialize SmartWeave
  const smartweave = WarpNodeFactory.memCached(arweave);

  // Get the key file used for the distribution
  const wallet: JWKInterface = JSON.parse(
    await fs.readFileSync(keyfile).toString()
  );
  const walletAddress = await arweave.wallets.jwkToAddress(wallet);

  // Read the ANT Registry Contract
  const pst = smartweave.pst(arnsRegistryContractTxId);
  pst.connect(wallet);

  // check if this name exists in the registry, if not exit the script.
  const currentState = await pst.currentState();
  const currentStateString = JSON.stringify(currentState);
  const currentStateJSON = JSON.parse(currentStateString);
  if (currentStateJSON.records[nameToBuy] !== undefined) {
    console.log("This name %s is already taken and is not available for purchase.  Exiting.", nameToBuy);
    return;
  }
  // Create the initial state
  const initialState = {
    ticker: ticker,
    name,
    owner: walletAddress,
    evolve: null,
    records: {
      ["@"]: dataPointer
    },
    balances: {
      [walletAddress]: 1,
    }
  };

  // Deploy ANT Contract in order to link to the new record
  console.log(
    "Creating ANT for %s using sourceTx",
    name,
    antRecordContractTxId
  );
  const contractTxId = await smartweave.createContract.deployFromSourceTx({
    wallet,
    initState: JSON.stringify(initialState),
    srcTxId: antRecordContractTxId,
  });

  // Buy the available record in ArNS Registry
  console.log(
    "Buying the record, %s using the ANT %s",
    nameToBuy,
    contractTxId
  );
  await pst.writeInteraction({
    function: "buyRecord",
    name: nameToBuy,
    contractTransactionId: contractTxId,
  });
  console.log("Finished purchasing the record");
})();
