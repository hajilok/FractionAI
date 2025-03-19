import axios from "axios";
import chalk from "chalk";
import figlet from "figlet";
import Web3 from "web3";
import fs from "fs/promises";
import JoinSpace from "./joinSpace.js";
import getSessions from "./getSessions.js";
import { getRandom } from "random-useragent";
import { solvedCapcha } from "./bypass.js";
import { Nocaptcha } from "./bypassNochapcha.js";
import joinRapSpace from "./rapSpace.js";
import { token } from "./config.js";

const random = getRandom();

const displayBanner = () => {
  console.log(
    chalk.cyan(
      figlet.textSync("Makmum Airdrop", {
        font: "Slant",
        horizontalLayout: "default",
        verticalLayout: "default",
        width: 80,
        whitespaceBreak: true,
      })
    )
  );
  const hakari = chalk.bgBlue("Created by https://t.me/hakaringetroll");
  console.log(hakari);
  console.log("Join To get Info airdrop : https://t.me/makmum");
};
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getNonce = async () => {
  const getNonce = await axios.get(
    "https://dapp-backend-4x.fractionai.xyz/api3/auth/nonce"
  );
  const nonce = getNonce.data.nonce;
  return {
    nonce,
    url: getNonce.data.image,
  };
};

const login = async (privateKey) => {
  const web3 = new Web3(
    new Web3.providers.HttpProvider("https://sepolia.infura.io")
  );
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
  const { nonce } = await getNonce();

  const issuedAt = new Date().toISOString();
  const message = `dapp.fractionai.xyz wants you to sign in with your Ethereum account:
${account.address}

Sign in with your wallet to Fraction AI.

URI: ttps://dapp.fractionai.xyz
Version: 1
Chain ID: 11155111
Nonce: ${nonce}
Issued At: ${issuedAt}`;

  const signature = web3.eth.accounts.sign(message, privateKey);
  const payload = {
    message,
    signature: signature.signature,
    referralCode: "66448E24",
  };

  const loginData = await axios.post(
    "https://dapp-backend-4x.fractionai.xyz/api3/auth/verify",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return loginData.data;
};

const main = async () => {
  displayBanner();
  console.log(chalk.blue("Memulai Mesin auto join space..."));
  const wallet = (await fs.readFile("wallet.txt", "utf-8"))
    .replace(/\r/g, "")
    .split("\n")
    .filter(Boolean);
  // const api = (await fs.readFile("api.txt", "utf-8"))
  //   .replace(/\r/g, "")
  //   .split("\n")
  //   .filter(Boolean);

  while (true) {
    for (let i = 0; i < wallet.length; i++) {
      try {
        const privateKey = wallet[i];
        const formattedPrivateKey = privateKey.startsWith("0x")
          ? privateKey
          : "0x" + privateKey;
        const getlogin = await login(formattedPrivateKey);
        const getAiagent = await JoinSpace(
          getlogin.accessToken,
          getlogin.user.id
        );
        console.log(
          chalk.green(
            `Success login with wallet: ${getlogin.user.walletAddress} \nFractal Amount : ${getlogin.user.fractal}`
          )
        );
        console.log(chalk.green(`Total agent: ${getAiagent.aiagentId.length}`));
        const getTiypebypass = async (dataIMGNONCE) => {
          let api;
          if (token["2chapcha"] && token.Nocapcha) {
            const random = Math.floor(Math.random() * 2);
            if (random === 0) {
              api = token["2chapcha"];
              console.log(`use 2chapcha`);
              return (await solvedCapcha(dataIMGNONCE.url, api)).text;
            } else {
              api = token.Nocapcha;
              console.log(`use nochapcha`);
              return await Nocaptcha(api, dataIMGNONCE.url);
            }
          } else if (token["2chapcha"]) {
            api = token["2chapcha"];
            console.log(`use 2chapcha`);
            return (await solvedCapcha(dataIMGNONCE.url, api)).text;
          } else if (token.Nocapcha) {
            api = token.Nocapcha;
            console.log(`use nochapcha`);
            return await Nocaptcha(api, dataIMGNONCE.url);
          } else {
            throw new Error("No captcha service available");
          }
        };
        for (let j = 0; j < getAiagent.aiagentId.length; j++) {
          const aiagentId = getAiagent.aiagentId[j];
          const agentName = getAiagent.nameAgent[j];
          const session = await getSessions(getlogin);

          if (!session || session.length < 6) {
            const dataIMGNONCE = await getNonce();
            const getTypechapcha = await getTiypebypass(dataIMGNONCE);
            const getJoinSpace = await joinRapSpace(
              getTypechapcha,
              getlogin,
              aiagentId,
              dataIMGNONCE.nonce
            );
            if (getJoinSpace.status === 200) {
              console.log(
                chalk.green(
                  `Success join space with ${agentName} : agentId: ${aiagentId} `
                )
              );
            } else if (getJoinSpace.error === "Invalid captcha") {
              console.log(chalk.red("Invalid captcha"));
            } else if (
              getJoinSpace.error.includes("maximum number of sessions")
            ) {
              throw new Error(
                chalk.yellow(`Session full switch for next account`)
              ).message;
            } else {
              console.log(chalk.yellow(getJoinSpace.error));
            }
          } else {
            console.log(chalk.yellow(`Session full atau tidak ditemukan`));
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
    console.log(chalk.blue("Wait 1 Hour to delay fix Session ..."));
    await delay(3600000);
  }
};

main();
