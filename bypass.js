import axios from "axios";
import { EventEmitter } from "events";
import WebSocket from "ws";
import crypto from "crypto";

// Meningkatkan batas maksimum listener
EventEmitter.defaultMaxListeners = 20;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (url, options, retries = 3) => {
  if (!url || typeof url !== "string") {
    throw new Error("URL tidak valid atau undefined.");
  }

  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url, options);
    } catch (error) {
      console.log(`⚠️ Retry ${i + 1}/${retries} - Error: ${error.message}`);
      await delay(5000);
    }
  }
  throw new Error("Gagal mendapatkan response setelah beberapa percobaan.");
};

const solvedCapcha = async (url, api) => {
  const getImage = await fetchWithRetry(url, {
    responseType: "arraybuffer",
    timeout: 60000,
  });

  function generateSessionHash() {
    return crypto.randomBytes(8).toString("hex"); // Contoh: "a1b2c3d4e5f6g7h8"
  }

  const sessionHash = generateSessionHash();
  const dataBase64 = Buffer.from(getImage.data).toString("base64");

  const wsFunction = async (dataBase64, sessionHash) => {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket("wss://pixnova.ai/upscale-img/queue/join");

      ws.on("open", () => {
        console.log("Connected to Pixnova WebSocket");
        ws.send(
          JSON.stringify({ msg: "session_hash", session_hash: sessionHash })
        );
        ws.send(
          JSON.stringify({
            msg: "send_data",
            data: { source_image: `data:image/png;base64,${dataBase64}` },
          })
        );
      });

      ws.on("message", (data) => {
        const jsonData = JSON.parse(data);

        if (jsonData.msg === "process_completed") {
          console.log("Processing done:", jsonData.output.result[0]);
          ws.close();
          resolve(jsonData.output.result[0]); // Mengembalikan URL gambar
        }
      });

      ws.on("error", (error) => {
        console.error("WebSocket Error:", error);
        reject(error);
      });

      ws.on("close", () => {
        console.log("WebSocket connection closed");
      });
    });
  };

  const urlImage = await wsFunction(dataBase64, sessionHash);
  const getDataImage = await fetchWithRetry(urlImage, {
    responseType: "arraybuffer",
    timeout: 60000,
  });

  const capchaSolved = await axios.post("https://api.2captcha.com/createTask", {
    clientKey: api,
    task: {
      type: "ImageToTextTask",
      body: Buffer.from(getDataImage.data).toString("base64"),
      phrase: false,
      case: true,
      numeric: 0,
      math: false,
      minLength: 1,
      maxLength: 5,
      comment: "enter the text you see on the image",
    },
    languagePool: "en",
  });

  const getResultCapcha = async (taskId) => {
    let attempts = 0;
    while (attempts < 5) {
      await delay(10000);
      const getCapcha = await axios.post(
        "https://api.2captcha.com/getTaskResult",
        { clientKey: api, taskId: taskId }
      );
      if (getCapcha.data.status === "ready") {
        console.log("Captcha solved:", getCapcha.data.solution.text);
        return getCapcha.data.solution.text;
      }
      attempts++;
    }
    console.log("Gagal menyelesaikan capcha.");
    return null;
  };

  return await getResultCapcha(capchaSolved.data.taskId);
};

export default solvedCapcha;
