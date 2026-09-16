let pocketNetProxyInstance = null;

export async function getPocketNetProxyInstance() {
    if (!pocketNetProxyInstance) {
        const module = await import("pocketnet-proxy-api");

        const PocketNetProxyApi =
            module.default?.default ||
            module.default ||
            module;

        pocketNetProxyInstance = await PocketNetProxyApi.create();
    }

    return pocketNetProxyInstance;
}
