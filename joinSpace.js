import { getRandom } from "random-useragent";

const random = getRandom();

const JoinSpace = async (bearer, id) => {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  await delay(3000);
  try {
    const response = await fetch(
      `https://dapp-backend-4x.fractionai.xyz/api3/agents/user/${id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${bearer}`,
          "User-Agent": random,
          "Accept-Language": "en-US,en;q=0.9",
          "Content-Type": "application/json",
          "Allowed-State": "na",
        },
      }
    );

    if (!response.ok) {
      console.log(response);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const aiagent = await response.json();
    const aiagentId = aiagent.map((agent) => agent.id);
    const nameAgent = aiagent.map((agent) => agent.name);

    return { aiagentId, nameAgent };
  } catch (error) {
    console.error("Error:", error.message);
    return null;
  }
};

export default JoinSpace;
