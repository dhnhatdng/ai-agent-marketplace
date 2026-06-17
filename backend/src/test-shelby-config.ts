async function test() {
  try {
    const { ShelbyNodeClient } = await Function('return import("@shelby-protocol/sdk/node")')();
    // In ra toàn bộ thuộc tính hoặc cấu trúc constructor của ShelbyNodeClient
    console.log("ShelbyNodeClient exports:", Object.keys(ShelbyNodeClient.prototype));
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}
test();

export {};
