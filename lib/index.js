import ProxyModule from "pocketnet-proxy-api";

const PocketNetProxyApi = ProxyModule.default || ProxyModule;

let pocketNetProxyInstance = null;

export async function getPocketNetProxyInstance() {
    if (!pocketNetProxyInstance) {
        pocketNetProxyInstance = await PocketNetProxyApi.create();
    }

    return pocketNetProxyInstance;
}

export { PocketNetProxyApi };
