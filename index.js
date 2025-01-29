import axios from "axios";
import chalk from "chalk";
import figlet from "figlet";
import Web3 from "web3";
import fs from "fs/promises";
import JoinSpace from "./joinSpace.js";

const displayBanner = () => {
    console.log(chalk.cyan(figlet.textSync('Makmum Airdrop', {
        font: 'Slant',
        horizontalLayout: 'default',
        verticalLayout: 'default',
        width: 80,
        whitespaceBreak: true
    })));
    const hakari = chalk.bgBlue('Created by https://t.me/hakaringetroll');
    console.log(hakari)
    console.log('Join To get Info airdrop : https://t.me/makmum');
}
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const login = async (privateKey) => {
    const web3 = new Web3(new Web3.providers.HttpProvider("https://sepolia.infura.io"));
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);

    const getNonce = await axios.get('https://dapp-backend-large.fractionai.xyz/api3/auth/nonce');
    const nonce = getNonce.data.nonce;
    console.log(chalk.green(`Nonce: ${nonce}`));

    const issuedAt = new Date().toISOString();
    const message = `dapp.fractionai.xyz wants you to sign in with your Ethereum account:
${account.address}

Sign in with your wallet to Fraction AI.

URI: https://dapp.fractionai.xyz
Version: 1
Chain ID: 11155111
Nonce: ${nonce}
Issued At: ${issuedAt}`;

    const signature = web3.eth.accounts.sign(message, privateKey);
    const payload = {
        message,
        signature: signature.signature,
        referralCode: "66448E24"
    };

    const loginData = await axios.post('https://dapp-backend-large.fractionai.xyz/api3/auth/verify', payload, {
        headers: {
            'Content-Type': 'application/json',
        }
    });
    
    return loginData.data;
};

const main = async () => {
    displayBanner();
    console.log(chalk.blue('Memulai Mesin auto join space...'));
    const wallet = (await fs.readFile('wallet.txt', 'utf-8'))
        .replace(/\r/g, "")
        .split('\n')
        .filter(Boolean);

    while (true) {
        for (let i = 0; i < wallet.length; i++) {
            try {
                const privateKey = wallet[i];
                const formattedPrivateKey = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;
                const getlogin = await login(formattedPrivateKey);
                const getAiagent = await JoinSpace(getlogin.accessToken, getlogin.user.id);
                console.log(chalk.green(`Success login with wallet: ${getlogin.user.walletAddress} \nFractal Amount : ${getlogin.user.fractal}`));
                console.log(chalk.green(`Total agent: ${getAiagent.aiagentId.length}`));
                
                let agentCount = 0;
                for (let j = 0; j < getAiagent.aiagentId.length; j++) {
                    if (agentCount >= 2) {
                        console.log(chalk.yellow('Menunggu 3 menit sebelum melanjutkan ke agen berikutnya...'));
                        await delay(180000);
                        agentCount = 0;
                    }
                    
                    const aiagentId = getAiagent.aiagentId[j];
                    const agentName = getAiagent.nameAgent[j];
                    try {
                        const joinSpace = await axios.post(
                            `https://dapp-backend-large.fractionai.xyz/api3/matchmaking/initiate`,
                            { userId: getlogin.user.id, agentId: aiagentId, entryFees: 0.001, sessionTypeId: 1 },
                            {
                                headers: {
                                    Authorization: `Bearer ${getlogin.accessToken}`,
                                    'Content-Type': 'application/json'
                                }
                            }
                        );
                    
                        if (joinSpace.status === 200) {
                            console.log(chalk.green(`Success join space with ${agentName} : agentId: ${aiagentId} `));
                            agentCount++;
                        }
                    } catch (error) {
                        if (error.response) {
                            console.log(chalk.yellow(`Failed join space with ${agentName} agent: ${aiagentId}, Status: ${error.response.status}, Reason: ${error.response.data.error || "Unknown"}`));
                        } else {
                            console.log(chalk.red(`Error occurred: ${error.message}`));
                        }
                    }
                }
            } catch (error) {
                console.error(error);
            }
        }
        console.log(chalk.blue('Menunggu 20 menit sebelum siklus berikutnya...'));
        await delay(1200000);
    }
};

main();
