```js
export default async function handler(req, res) {
    try {
        const address = req.query?.address;

        if (!address) {
            return res.status(400).json({
                success: false,
                error: "address is required"
            });
        }

        const module = await import("pocketnet-proxy-api");

        const PocketNetProxyApi =
            module.default || module;

        const api =
            await PocketNetProxyApi.create();

        const result =
            await api.rpc.getuserprofile({
                address,
                shortForm: "basic"
            });

        return res.status(200).json({
            success: true,
            address,
            profile: result
        });

    } catch (error) {
        console.error("PROFILE API ERROR:", error);

        return res.status(500).json({
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : String(error)
        });
    }
}
```

После вставки:

**Commit changes → Commit changes**

Больше пока ничего не меняй.

⚠️ Если после Commit Vercel покажет ошибку сборки про `canvas`, **не пытайся её исправлять сам**. Просто пришли мне ошибку — будем обходить именно эту проблему, не ломая работающий баланс.

После успешного деплоя напиши **«готово»**.
