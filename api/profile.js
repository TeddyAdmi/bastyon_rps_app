```js
export default async function handler(req, res) {
    return res.status(200).json({
        success: true,
        test: "NEW_PROFILE_API",
        time: new Date().toISOString()
    });
}
```
