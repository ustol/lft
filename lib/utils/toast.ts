// Lightweight toast — wraps console until a toast library is wired up.
// Replace with sonner or react-hot-toast as needed.
export const toast = {
  success: (msg: string) => console.log("[toast:success]", msg),
  error: (msg: string) => console.error("[toast:error]", msg),
  info: (msg: string) => console.info("[toast:info]", msg),
};
