import Arweave from "arweave";
import { LoggerFactory, SmartWeaveNodeFactory } from "redstone-smartweave";
import * as fs from "fs";
import { JWKInterface } from "arweave/node/lib/wallet";
import { deployedContracts } from "../deployed-contracts";
import { keyfile } from "../constants";

(async () => {
    //~~~~~~~~~~~~~~~~~~~~~~~~~~UPDATE THE BELOW~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // This is the name that will be purchased in the Gateway Name System Registry
  const nameToBuy = "genesis";

  // This is the GNT Smartweave Contract TX ID that will be added to the registry
  const contractTxId = "xEL3QuBjrJtlJm4DSHn7BKB5S-riLc1qCkmn3r-xkiE";

  // This is the production GNS Registry Smartweave Contract
  const gnsRegistryContractTxId = "Wr27DYc_5cuquhvpMbnhy2idGf_vzOnn0gYHqSgTXNE";
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

  // Read the GNT Registry Contract
  const pst = smartweave.pst(gnsRegistryContractTxId);
  pst.connect(wallet);

  // check if this name exists in the registry, if not exit the script.
  const currentState = await pst.currentState();
  const currentStateString = JSON.stringify(currentState);
  const currentStateJSON = JSON.parse(currentStateString);
  if (currentStateJSON.records[nameToBuy] !== undefined) {
    console.log("This name %s is already taken and is not available for purchase.  Exiting.", nameToBuy);
    return;
  }

  // Buy the available record in GNS Registry
  console.log(
    "Buying the record, %s using the GNT %s",
    nameToBuy,
    contractTxId
  );
  const recordTxId = await pst.writeInteraction({
    function: "buyRecord",
    name: nameToBuy,
    contractTransactionId: contractTxId,
  });
  console.log("Finished purchasing the record: %s", recordTxId);
})();
