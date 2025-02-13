const JoinSpace = async (bearer, id) => {
  console.log(bearer);
  try {
    const response = await fetch(
      `https://dapp-backend-4x.fractionai.xyz/api3/agents/user/${id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${bearer}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
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
