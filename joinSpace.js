import axios from "axios";

const JoinSpace = async (bearer, id) => {
    const getAiagent = await axios.get(`https://dapp-backend-large.fractionai.xyz/api3/agents/user/${id}`, {headers: {Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json'}});
    const aiagent = getAiagent.data;
    const aiagentId = []
    const nameAgent = []
    for (let i = 0 ; i < aiagent.length; i++) {
        aiagentId.push(aiagent[i].id);
        nameAgent.push(aiagent[i].name);
    }

    const detail = {
        aiagentId: aiagentId,
        nameAgent: nameAgent
    }

    return detail;

};

export default JoinSpace;