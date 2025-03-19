import axios from "axios";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const Nocaptcha = async (api, url) => {
  const response = await axios.post(`https://api.nopecha.com/`, {
    key: api,
    type: "textcaptcha",
    image_urls: [url],
  });
  if (!response.data.data) {
    console.log("❌ Gagal bypass captcha");
    return null;
  }
  console.log("getBypassID", response.data.data);
  let attempts = 0;
  while (attempts < 5) {
    await delay(10000);
    try {
      const capchaSolved = await axios.get(
        `https://api.nopecha.com?key=${api}&id=${response.data.data}`
      );
      if (!capchaSolved.data.data[0]) {
        return null;
      } else {
        console.log("getBypass", capchaSolved.data.data[0]);
        return capchaSolved.data.data[0];
      }
    } catch (error) {
      console.error("⚠️ Error saat mengambil hasil captcha:", error.message);
    }
    attempts++;
  }
  console.log("❌ Gagal menyelesaikan captcha setelah 5 percobaan.");
};
