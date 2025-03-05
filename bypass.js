import axios from "axios";
import { EventEmitter } from "events";
import WebSocket from "ws";
import crypto from "crypto";

// Meningkatkan batas maksimum listener untuk mencegah memory leak
EventEmitter.defaultMaxListeners = 20;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (url, options, retries = 3) => {
  if (!url || typeof url !== "string") {
    console.error("⚠️ URL tidak valid:", url);
    return null;
  }

  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url, options);
    } catch (error) {
      console.log(`⚠️ Retry ${i + 1}/${retries} - Error: ${error.message}`);
      await delay(5000);
    }
  }

  console.error("❌ Gagal mendapatkan response setelah beberapa percobaan.");
  return null;
};

export const solvedCapcha = async (url, api) => {
  try {
    const getImage = await fetchWithRetry(url, {
      responseType: "arraybuffer",
      timeout: 60000,
    });

    if (!getImage) {
      console.error("❌ Gagal mengambil gambar captcha.");
      return null;
    }

    function generateSessionHash() {
      return crypto.randomBytes(8).toString("hex");
    }

    const sessionHash = generateSessionHash();
    const dataBase64 = Buffer.from(getImage.data).toString("base64");

    const wsFunction = async (dataBase64, sessionHash) => {
      return new Promise((resolve, reject) => {
        const ws = new WebSocket("wss://pixnova.ai/upscale-img/queue/join");

        ws.on("open", () => {
          console.log("✅ Connected to Pixnova WebSocket");
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
          try {
            const jsonData = JSON.parse(data);

            if (jsonData.msg === "process_completed") {
              console.log("✅ Processing done:", jsonData.output.result[0]);
              ws.close();
              resolve(jsonData.output.result[0]);
            }
          } catch (error) {
            console.error("❌ Error parsing WebSocket message:", error.message);
          }
        });

        ws.on("error", (error) => {
          console.error("❌ WebSocket Error:", error);
          ws.close();
          reject(error);
        });

        ws.on("close", () => {
          console.log("🔌 WebSocket connection closed");
        });

        setTimeout(() => {
          ws.close();
          reject(new Error("WebSocket Timeout"));
        }, 60000);
      });
    };

    const urlImage = await wsFunction(dataBase64, sessionHash);
    if (!urlImage) {
      console.error("❌ Gagal mendapatkan URL hasil captcha.");
      return null;
    }

    const getDataImage = await fetchWithRetry(urlImage, {
      responseType: "arraybuffer",
      timeout: 60000,
    });

    if (!getDataImage) {
      console.error("❌ Gagal mendapatkan gambar hasil captcha.");
      return null;
    }

    const capchaSolved = await axios.post(
      "https://api.2captcha.com/createTask",
      {
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
      }
    );

    if (!capchaSolved || !capchaSolved.data || !capchaSolved.data.taskId) {
      console.log(capchaSolved.data);
      console.error("❌ Gagal mengirim gambar captcha ke 2Captcha.");
      return null;
    }

    const getResultCapcha = async (taskId) => {
      let attempts = 0;
      while (attempts < 5) {
        await delay(10000);
        try {
          const getCapcha = await axios.post(
            "https://api.2captcha.com/getTaskResult",
            {
              clientKey: api,
              taskId: taskId,
            }
          );

          if (getCapcha.data.status === "ready") {
            console.log("✅ Captcha solved:", getCapcha.data.solution.text);
            return {
              taskId: taskId,
              text: getCapcha.data.solution.text,
            };
          }
        } catch (error) {
          console.error(
            "⚠️ Error saat mengambil hasil captcha:",
            error.message
          );
        }

        attempts++;
      }

      console.log("❌ Gagal menyelesaikan captcha setelah 5 percobaan.");
      return null;
    };

    return await getResultCapcha(capchaSolved.data.taskId);
  } catch (error) {
    console.error("❌ Terjadi kesalahan dalam solvedCapcha:", error.message);
    return null;
  }
};

export const reportCaptcha = async (api, taskId) => {
  try {
    const response = await axios.post(
      "https://api.2captcha.com/reportCorrect",
      {
        clientKey: api,
        taskId: taskId,
      }
    );

    if (response.data.status === "success") {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

export const reportIncorrectCaptcha = async (api, taskId) => {
  try {
    const response = await axios.post(
      "https://api.2captcha.com/reportIncorrect",
      {
        clientKey: api,
        taskId: taskId,
      }
    );

    if (response.data.status === "success") {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};
