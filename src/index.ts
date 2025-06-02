export const log = (...args: any[]) => {
  console.log("RISK LEGACY | ", ...args);
};

Hooks.once("ready", () => {
  log("System Ready");
});
