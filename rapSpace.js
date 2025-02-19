import axios from "axios";
import chalk from "chalk";
import { getRandom } from "random-useragent";

const random = getRandom();

const joinRapSpace = async (
  dataIMGNONCE,
  getBypass,
  getlogin,
  aiagentId,
  agentName
) => {
  try {
    const joinSpace = await axios.post(
      `https://dapp-backend-4x.fractionai.xyz/api3/matchmaking/initiate`,
      {
        userId: getlogin.user.id,
        agentId: aiagentId,
        entryFees: 0.001,
        sessionTypeId: 1,
        nonce: dataIMGNONCE.nonce,
        captchaText: getBypass,
      },
      {
        headers: {
          Authorization: `Bearer ${getlogin.accessToken}`,
          "User-Agent": random,
          "Accept-Language": "en-US,en;q=0.9",
          "Content-Type": "application/json",
          "Allowed-State": "na",
        },
      }
    );
    return joinSpace;
  } catch (error) {
    return error.response.data;
  }
};

export default joinRapSpace;
