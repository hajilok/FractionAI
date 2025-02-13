import axios from "axios";
import { getRandom } from "random-useragent";

const random = getRandom();
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getSessions = async (getlogin) => {
  console.log(`30 detik delay to avoid rate limit`);
  await delay(30000);
  try {
    const getSessions = await axios.get(
      `https://dapp-backend-4x.fractionai.xyz/api3/session-types/live-paginated/user/${getlogin.user.id}?pageSize=10&pageNumber=1&status=live`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": random,
          "Accept-Language": "en-US,en;q=0.9",
          "Content-Type": "application/json",
          "Allowed-State": "na",
        },
      }
    );
    const sessions = getSessions.data;
    return sessions.sessions.sessions;
  } catch (error) {
    return error.message;
  }
};

export default getSessions;
