const api = await getPocketNetProxyInstance();

const result = await api.rpc.getuserprofile({
    address: address,
    shortForm: "basic"
});
