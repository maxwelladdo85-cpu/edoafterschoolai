import { c as createServerRpc } from "./createServerRpc-Cc1mmEGZ.js";
import { l as createServerFn, a7 as setResponseHeaders } from "./server-Cxw6WwHr.js";
import "node:async_hooks";
import "node:stream/web";
import "node:stream";
const setLandingCacheHeaders_createServerFn_handler = createServerRpc({
  id: "a995ef04de62c20e35d757dc35d3d1c7d34c66ae79915914d353715ec9da631a",
  name: "setLandingCacheHeaders",
  filename: "src/routes/index.tsx"
}, (opts) => setLandingCacheHeaders.__executeServer(opts));
const setLandingCacheHeaders = createServerFn({
  method: "GET"
}).handler(setLandingCacheHeaders_createServerFn_handler, async () => {
  setResponseHeaders(new Headers({
    "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=86400"
  }));
  return {
    ok: true
  };
});
export {
  setLandingCacheHeaders_createServerFn_handler
};
