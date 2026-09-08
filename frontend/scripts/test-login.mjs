import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient("https://adorable-wren-85.convex.cloud");
const args = {
  provider: "password",
  params: { email: "alquimiafoods@proton.me", password: "Rend.8105#_Pap#*", flow: "signIn" },
};
try {
  const result = await client.action("auth:signIn", args);
  console.log("SUCCESS:", JSON.stringify(result, null, 2));
} catch (e) {
  console.log("ERROR NAME:", e?.name);
  console.log("ERROR MESSAGE:", e?.message);
  console.log("ERROR DATA:", JSON.stringify(e?.data ?? e));
}