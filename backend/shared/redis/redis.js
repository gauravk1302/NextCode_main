
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6380";

const redis = new Redis(redisUrl);

redis.on("connect", () => {
  console.log("Redis Connected.");
});

redis.on("ready", () => {
  console.log("Redis Ready.");
});

redis.on("error", (err) => {
  console.error("Redis Error:", err.message);
});

export default redis;
