S3async function transit_sort(raw_text) {
    const rowCount = raw_text.length;
    const colCount = 10;
    const table = Array.from({ length: rowCount }, () => Array(colCount).fill(null));
    let j = 0;
    let status = "exit";
    let test_fare = 610;
    // date (of entry || exit if entry null) 0, icon 1, nTime 2, nStation 3,
    // isInvalid 4, pass 5, fare 6, osi 7, xTime 8, xStation 9
    for (let i = 0; i < rowCount; i++) {
        const obj = raw_text[i];
        const logDate = new Date(obj.timestamp);
        const optionsDate = { day: "2-digit", month: "short", year: "numeric" };
        const optionsTime = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false };
        switch (obj.message) {
            case "card-entry":
                if (status === "exit") {
                    let station = obj.data.nStation;
                    if (["Bus-", "KTB", "ETB", "BRT"].some(s => station.includes(s))) {
                        table[j][1] = "directions_bus";
                    } else if (["Boat-"].some(s => station.includes(s))) {
                        table[j][1] = "directions_boat";
                    } else if (["LibraryKNUT", "CentralLibrary", "BaanRattana", "IICP", "Cinemaru", "Screen", "Not in use"].some(s => station.includes(s))) {
                        continue; // skip this row
                    } else {
                        table[j][1] = "directions_railway";
                    }
                    table[j][0] = logDate.toLocaleDateString(undefined, optionsDate);
                    table[j][2] = logDate.toLocaleTimeString(undefined, optionsTime);
                    if (station.includes("KTB-")) {
                        let tmp = station.slice(4);
                        station = await getKtbStation(tmp);
                    }
                    table[j][3] = station;
                    status = "entry";
                } else if (status === "entry") {
                    let station = obj.data.nStation;
                    if (["LibraryKNUT", "CentralLibrary", "BaanRattana", "IICP", "Cinemaru", "Screen", "Not in use"].some(s => station.includes(s))) {
                        continue; // skip this row
                    }
                    table[j][4] = true;
                    j++;
                    if (["Bus-", "KTB", "ETB", "BRT"].some(s => station.includes(s))) {
                        table[j][1] = "directions_bus";
                    } else if (["Boat-"].some(s => station.includes(s))) {
                        table[j][1] = "directions_boat";
                    } else if (["LibraryKNUT", "CentralLibrary", "BaanRattana", "IICP", "Cinemaru", "Screen", "Not in use"].some(s => station.includes(s))) {
                        continue; // skip this row
                    } else {
                        table[j][1] = "directions_railway";
                    }
                    table[j][0] = logDate.toLocaleDateString(undefined, optionsDate);
                    table[j][2] = logDate.toLocaleTimeString(undefined, optionsTime);
                    if (station.includes("KTB-")) {
                        let tmp = station.slice(4);
                        station = await getKtbStation(tmp);
                    }
                    table[j][3] = station;
                    status = "entry";
                    const tmp_next = raw_text[i+1];
                    if (tmp_next) {
                        const currentValue = Number(obj.data.value || 0);
                        const nextValue = Number(tmp_next.data.value || 0);

                        if (currentValue !== nextValue) {
                            table[j][6] = -(Math.abs(currentValue - nextValue).toFixed(2));
                        }
                    }
                    test_fare -= Math.abs(table[j][6]);
                }
                break;
            case "card-exit":
                if (status === "entry") {
                    let station = obj.data.xStation;
                    if (["LibraryKNUT", "CentralLibrary", "BaanRattana", "IICP", "Cinemaru", "Screen", "Not in use"].some(s => station.includes(s))) {
                        continue; // skip this row
                    }
                    table[j][4] = false;
                    table[j][5] = obj.data.railPass;
                    table[j][6] = -(Number(obj.data.fare));
                    table[j][7] = obj.data.osi;
                    table[j][8] = logDate.toLocaleTimeString(undefined, optionsTime);
                    if (station.includes("KTB-")) {
                        let tmp = station.slice(4);
                        station = await getKtbStation(tmp);
                    }
                    table[j][9] = station;

                    if (Number(Math.abs(obj.data.fare)) === 0 && i > 0) {
                        const tmp_next = raw_text[i-1];
                        if (tmp_next) {
                            const currentValue = Number(obj.data.value || 0);
                            const nextValue = Number(tmp_next.data.value || 0);

                            if (currentValue !== nextValue) {
                                table[j][6] = -(Math.abs(currentValue - nextValue).toFixed(2));
                            }
                        }
                    }

                    test_fare -= Math.abs(table[j][6]);
                    j++;
                    status = "exit";
                } else if (status === "exit") {
                    if (table[j][0] === null) table[j][0] = logDate.toLocaleDateString(undefined, optionsDate);
                    let station = obj.data.xStation;
                    if (["LibraryKNUT", "CentralLibrary", "BaanRattana", "IICP", "Cinemaru", "Screen", "Not in use"].some(s => station.includes(s))) {
                        continue; // skip this row
                    } else if (["Bus-", "KTB", "ETB", "BRT"].some(s => station.includes(s))) {
                        table[j][1] = "directions_bus";
                    } else if (["Boat-"].some(s => station.includes(s))) {
                        table[j][1] = "directions_boat";
                    } else {
                        table[j][1] = "directions_railway";
                    }
                    table[j][4] = true;
                    table[j][5] = obj.data.railPass;
                    table[j][6] = -(Number(obj.data.fare));
                    table[j][7] = obj.data.osi;
                    table[j][8] = logDate.toLocaleTimeString(undefined, optionsTime);
                    if (station.includes("KTB-")) {
                        let tmp = station.slice(4);
                        station = await getKtbStation(tmp);
                    }
                    table[j][9] = station;

                    if (Number(Math.abs(obj.data.fare)) === 0 && i > 0) {
                        const tmp_next = raw_text[i-1];
                        if (tmp_next) {
                            const currentValue = Number(obj.data.value || 0);
                            const nextValue = Number(tmp_next.data.value || 0);

                            if (currentValue !== nextValue) {
                                table[j][6] = -(Math.abs(currentValue - nextValue).toFixed(2));
                            }
                        }
                    }
                    test_fare -= Math.abs(table[j][6]);
                    j++;
                }
                break;
            case "payment":

                // date (of entry || exit if entry null) 0, icon 1, nTime 2, nStation 3,
                // isInvalid 4, pass 5, fare 6, osi 7, xTime 8, xStation 9
                if (obj.data.station) {
                    if (["LibraryKNUT", "CentralLibrary", "BaanRattana", "IICP", "Cinemaru", "Screen", "Not in use"].some(s => obj.data.station.includes(s))) {
                        continue; // skip this row
                    }

                    table[j][0] = logDate.toLocaleDateString(undefined, optionsDate);
                    table[j][1] = "directions_railway";
                    table[j][2] = logDate.toLocaleTimeString(undefined, optionsTime);
                    table[j][3] = obj.data.station;
                    table[j][5] = obj.data.railPass;
                    if (["Bus-", "KTB", "ETB", "BRT"].some(s => obj.data.station.includes(s))) {
                        table[j][1] = "directions_bus";
                    } else if (["Boat"].some(s => obj.data.station.includes(s))) {
                        table[j][1] = "directions_boat";
                    }
                    table[j][4] = "payment_transit_tag";
                    table[j][6] = -(Number(obj.data.price));
                    if (Number(Math.abs(obj.data.price)) === 0 && i > 0) {
                        const tmp_next = raw_text[i-1];
                        if (tmp_next) {
                            const currentValue = Number(obj.data.value || 0);
                            const nextValue = Number(tmp_next.data.value || 0);

                            if (currentValue !== nextValue) {
                                table[j][6] = -(Math.abs(currentValue - nextValue).toFixed(2));
                            }
                        }
                    }
                    j++;
                } else {
                    continue;
                }
                break;
            case "new-card":
            case "refund-card":
            case "top-up-card":
            default:
                continue;
        }
    }
    return table;
}

function transit_filter(raw_text) {
    let start = null;

    for (let i = 0; i <= raw_text.length; i++) {
        let val = raw_text[i]?.[7];
        let isTrue = val === true || val === "true";
        let isFalse = val === false || val === "false";

        if (isTrue && start === null) {
            // start of a true group
            start = i;
        }

        if ((isFalse || i === raw_text.length) && start !== null) {
            // end of the group, include this false row
            let end = i; // include i even if it's false

            let block = raw_text.slice(start, end + 1);

            // reverse only the specified fields
            let fields = [1, 2, 3, 8, 9];
            fields.forEach(fieldIdx => {
                let values = block.map(row => row[fieldIdx]).reverse();
                for (let k = 0; k < block.length; k++) {
                    block[k][fieldIdx] = values[k];
                }
            });

            // put block back
            for (let k = 0; k < block.length; k++) {
                raw_text[start + k] = block[k];
            }

            // reset start
            start = null;
        }
    }

    return raw_text;
}

async function getKtbStation(code) {
    let response = await fetch('https://masstransit.wasabi.winsanmwtv.me/api/ktb/station-mapping.json', { cache: "no-store" });
    let rawData = await response.text();
    obj = JSON.parse(rawData);

    console.log(rawData);

    for (let i = 0; i < obj.data.length; i++) {
        if (Number(code) === Number(obj.data[i].ktb)) return obj.data[i].name;
    }
    return "KTB Bus Stop";
}