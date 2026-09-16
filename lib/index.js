import PocketNetProxyApi from "./pocketnet-proxy-api.js";

let pocketNetProxyInstance = null;

export async function getPocketNetProxyInstance() {
    if (!pocketNetProxyInstance) {
        pocketNetProxyInstance = await PocketNetProxyApi.create();
    }

    return pocketNetProxyInstance;
}

export { PocketNetProxyApi };
