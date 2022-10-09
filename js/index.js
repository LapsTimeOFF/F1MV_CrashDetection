const config = JSON.parse(httpGet('../json/config.json'))

const F1MV_host = config.F1MV.host
const F1MV_port = config.F1MV.port

const DriverList = config.DriverList
const DriverName = config.DriverName


async function CarDataIsNotOK(i, reason) {
    // log(`${DriverName[i]} CarData is not OK. Reason : ${reason}`)

    const _issue = {
        "engine": reason.includes('Engine is off') ? true : false,
        "speed": reason.includes('Speed < 30KM/H') ? true : false,
        "reverse": reason.includes('Reverse gear engaged') ? true : false,
        "neutral": reason.includes('Neutral gear engaged') ? true : false
    }

    $(`#${DriverName[i]}`).remove()
    $('#cards').prepend(`
    <div id="${DriverName[i]}" class="driver not-ok">
        <h1>${DriverName[i]}</h1>
        <p>Issues : </p>
        <ul id="${DriverName[i]}_Issues">
            ${_issue.engine ? `<li id="${DriverName[i]}_Issues_engineOff">Engine is OFF</li>` : ''}
            ${_issue.speed ? `<li id="${DriverName[i]}_Issues_Speed<30">Speed < 30 km/h</li>` : ''}
            ${_issue.reverse ? `<li id="${DriverName[i]}_Issues_GearR">Reverse gear is engaged</li>` : ''}
            ${_issue.neutral ? `<li id="${DriverName[i]}_Issues_GearN">Neutral gear is engaged</li>` : ''}
        </ul>
    </div>
    `)
}

async function CarDataIsOK(i) {
    $(`#${DriverName[i]}`).remove()
}

async function dataIsOkFor(driverNumber, i) {
    // Get the data for Stopped or Retired
    // const dataForOut = await F1MV_API_CallTopic('TimingData')
    const dataForOut = JSON.parse(httpGet(await F1MV_API_BuildLiveTimingUrl('TimingData', F1MV_host, F1MV_port)))

    // Filter data to the requested driver
    const driverDataOUT = dataForOut.Lines[driverNumber]

    // Check if driver is out
    if(driverDataOUT.Retired || driverDataOUT.Stopped) {
        // log(`${DriverName[i]} is out of the race`)
        $(`#${DriverName[i]}`).remove()
        return;
    }
    if(driverDataOUT.InPit) {
        // log(`${DriverName[i]} is in pit`)
        $(`#${DriverName[i]}`).remove()
        return;
    }

    // 0: Engine RPM
    // 2: Speed (km/h)
    // 3: Gear (0 = N, 1-8 gears, >8 is usually reverse)
    // 4: Throttle percentage (0-100%)
    // 5: Brake (0-1)
    // 45: DRS (bit more complicated)

    // Get Data for the speed/RPM
    const CarData = JSON.parse(httpGet(await F1MV_API_BuildLiveTimingUrl('CarData', F1MV_host, F1MV_port)))

    const driverCarData = CarData.Entries[0].Cars[driverNumber].Channels

    const issues = []

    if(driverCarData[0] === 0) {
        issues.push('Engine is off')
    }
    if(driverCarData[2] <= 30) {
        issues.push('Speed < 30KM/H')
    }
    if(driverCarData[3] > 8) {
        issues.push('Reverse gear engaged')
    }
    if(driverCarData[3] === 0) {
        issues.push('Neutral gear engaged')
    }
    if(issues.length !== 0) {
        CarDataIsNotOK(i, issues);
    } else {
        CarDataIsOK(i)
    }
};

function checkForEveryDriver() {
    for (let _i = 0; _i < DriverName.length; _i++) {
        const driver = DriverList[DriverName[_i]];
        dataIsOkFor(driver, _i)
    }
}

(async () => {
    log(`
    Loaded config :
    Host=${F1MV_host}
    Port=${F1MV_port}
    F1MV_Version=${await F1MV_getF1MVVersion(F1MV_host, F1MV_port, true)}
    F1MV_APIVersion=${await F1MV_getAPIVersion(F1MV_host, F1MV_port, true)}
    DriverList=${JSON.stringify(DriverList)}
    `)
})();

setInterval(checkForEveryDriver, 100)