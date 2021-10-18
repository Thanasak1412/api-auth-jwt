const redis = require("redis");

const client = redis.createClient({
  port: 6379,
  host: "127.0.0.1",
});

client.on("connect", () => {
  console.log("Client connect to redis...");
});

client.on("ready", () => {
  console.log("Client connect to redis and ready to use...");
});

client.on("error", () => {
  console.log(error.message);
});

client.on("end", () => {
  console.log("Client disconnect to redis...");
});

client.on("SIGINT", () => {
  client.quit();
});

module.exports = client;
