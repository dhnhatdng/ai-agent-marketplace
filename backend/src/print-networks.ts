async function test() {
  try {
    const { shelbyNetworks } = await Function('return import("@shelby-protocol/sdk/node")')();
    console.log("shelbyNetworks values:", shelbyNetworks);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
}
test();

export {};
