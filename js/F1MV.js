async function F1MV_getF1MVVersion(host, port, log) {
    let res = await JSON.parse(httpGet(`http://${host}:${port}/api/v1/app/version`))
    ver = res.version
    ver = parseInt(ver.replace(/[\D]/g, ""))

    if(log === true) console.log(`Current F1MV Version : ${ver}`);

    return ver;
}

async function F1MV_getAPIVersion(host, port, log) {
    if(await F1MV_getF1MVVersion(host, port) >= 180) {
        if(log === true) console.log("Api version needed : v2");
        return 'v2';
    } else {
        if(log === true) console.log("Api version needed : v1");
        return 'v1';
    }
}

async function F1MV_API_BuildLiveTimingUrl(topic, host, port) {
    return `http://${host}:${port}/api/${await F1MV_getAPIVersion(host, port)}/live-timing${await F1MV_getAPIVersion(host, port) === 'v2' ? '/state': ''}/${topic}`
}

async function F1MV_API_CallTopic(topic, host, port) {
    return httpGet(await F1MV_API_BuildLiveTimingUrl(topic, host, port))
}