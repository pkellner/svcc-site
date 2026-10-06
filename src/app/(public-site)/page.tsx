import Home from "@/app/(public-site)/home/Home";

// function showEnvs() {
//   console.log("process.env.DATABASE_URL", process.env?.DATABASE_URL ?? "not set");
//   console.log("process.env.USE_REDIS_CACHE", process.env?.USE_REDIS_CACHE ?? "not set");
//   console.log("process.env.REDISHOST", process.env?.REDISHOST ?? "not set");
// }

export default function MainPage() {
  //showEnvs();
  return <Home />;
}
