import Arweave from "arweave";
import { LoggerFactory, SmartWeaveNodeFactory } from "redstone-smartweave";
import * as fs from "fs";
import { testKeyfile } from "../constants";
import { deployedTestContracts } from "../deployed-contracts";
import { addFunds } from "../../utils/_helpers";

(async () => {
  //~~~~~~~~~~~~~~~~~~~~~~~~~~UPDATE THE BELOW~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // A short token symbol, typically with GNT- in front
  const ticker = "GNT-Example";

  // A friendly name for the name of this token
  const name = "Example";

  // The arweave data transaction that is to be proxied using the registered name
  const dataPointer = "zHpMN6UyTSSIo6WqER2527LvEvMKLlAcr3UR6ljd32Q";
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

  // This is the GNT Smartweave Contract Source TX ID that will be used to create the new GNT
  const gntRecordContractTxId = deployedTestContracts.sourceTxId;

  // ~~ Initialize Arweave ~~
  const arweave = Arweave.init({
    host: "testnet.redstone.tools",
    timeout: 600000,
    port: 443,
    protocol: "https",
  });

  // ~~ Initialize `LoggerFactory` ~~
  LoggerFactory.INST.logLevel("error");

  // ~~ Initialize SmartWeave ~~
  const smartweave = SmartWeaveNodeFactory.memCached(arweave);

  // ~~ Generate Wallet and add funds ~~
  // const wallet = await arweave.wallets.generate();
  // const walletAddress = await arweave.wallets.jwkToAddress(wallet);
  const wallet = JSON.parse(await fs.readFileSync(testKeyfile).toString());
  const walletAddress = await arweave.wallets.jwkToAddress(wallet);
  await addFunds(arweave, wallet);
  
  // Create the initial state
  const initialState = {
    ticker: ticker,
    name,
    owner: walletAddress,
    evolve: null,
    records: 
    {
      ["@"]: dataPointer,
    },
    balances: {
      [walletAddress]: 1,
    },
  };

  // ~~ Deploy contract ~~
  console.log("Creating GNT for %s", name);
  const contractTxId = await smartweave.createContract.deployFromSourceTx({
    wallet,
    initState: JSON.stringify(initialState),
    srcTxId: gntRecordContractTxId,
  });

  // ~~ Log contract id to the console ~~
  console.log("Mainnet Contract id %s", contractTxId);
})();
