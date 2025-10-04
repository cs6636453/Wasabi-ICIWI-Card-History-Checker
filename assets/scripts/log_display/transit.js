// --- TRANSIT SORT ---
async function transit_sort(raw_text) {
    const rowCount = raw_text.length;
    const colCount = 10;
    const table = Array.from({ length: rowCount }, () => Array(colCount).fill(null));
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    let j = 0;
    let status = "exit";
    let test_fare = 610;

    for (let i = 0; i < rowCount; i++) {
        const obj = raw_text[i];
        const logDate = new Date(obj.timestamp);

        // Format date as "22 Sep 2025"
        const day = String(logDate.getDate()).padStart(2, "0");
        const month = monthNames[logDate.getMonth()];
        const year = logDate.getFullYear();
        const formattedDate = `${day} ${month} ${year}`;

        // Format time as "22:29:30"
        const hours = String(logDate.getHours()).padStart(2, "0");
        const minutes = String(logDate.getMinutes()).padStart(2, "0");
        const seconds = String(logDate.getSeconds()).padStart(2, "0");
        const formattedTime = `${hours}:${minutes}:${seconds}`;

        switch (obj.message) {
            case "card-entry":
                if (status === "exit") {
                    let station = obj.data.nStation;
                    if (["Bus-", "KTB", "ETB", "BRT"].some(s => station.includes(s))) table[j][1] = "directions_bus";
                    else if (["Boat-"].some(s => station.includes(s))) table[j][1] = "directions_boat";
                    else if (["LibraryKNUT","CentralLibrary","BaanRattana","IICP","Cinemaru","Screen","Not in use"].some(s=>station.includes(s))) continue;
                    else table[j][1] = "directions_railway";

                    table[j][0] = formattedDate;
                    table[j][2] = formattedTime;

                    if (station.includes("KTB-")) station = await getKtbStation(station.slice(4));

                    table[j][3] = station;
                    status = "entry";
                } else if (status === "entry") {
                    let station = obj.data.nStation;
                    if (["LibraryKNUT","CentralLibrary","BaanRattana","IICP","Cinemaru","Screen","Not in use"].some(s=>station.includes(s))) continue;
                    table[j][4] = true;
                    j++;
                    if (["Bus-", "KTB", "ETB", "BRT"].some(s => station.includes(s))) table[j][1] = "directions_bus";
                    else if (["Boat-"].some(s => station.includes(s))) table[j][1] = "directions_boat";
                    else table[j][1] = "directions_railway";

                    table[j][0] = formattedDate;
                    table[j][2] = formattedTime;

                    if (station.includes("KTB-")) station = await getKtbStation(station.slice(4));
                    table[j][3] = station;

                    status = "entry";
                    const tmp_next = raw_text[i+1];
                    if (tmp_next) {
                        const currentValue = Number(obj.data.value || 0);
                        const nextValue = Number(tmp_next.data.value || 0);
                        if (currentValue !== nextValue) table[j][6] = -(Math.abs(currentValue-nextValue).toFixed(2));
                    }
                    test_fare -= Math.abs(table[j][6] || 0);
                }
                break;

            case "card-exit":
                if (status === "entry") {
                    let station = obj.data.xStation;
                    if (["LibraryKNUT","CentralLibrary","BaanRattana","IICP","Cinemaru","Screen","Not in use"].some(s=>station.includes(s))) continue;

                    table[j][4] = false;
                    table[j][5] = obj.data.railPass;
                    table[j][6] = -(Number(obj.data.fare));
                    table[j][7] = obj.data.osi;
                    table[j][8] = formattedTime;

                    if (station.includes("KTB-")) station = await getKtbStation(station.slice(4));
                    table[j][9] = station;

                    if (Number(Math.abs(obj.data.fare)) === 0 && i>0) {
                        const tmp_prev = raw_text[i-1];
                        if (tmp_prev) {
                            const currentValue = Number(obj.data.value || 0);
                            const prevValue = Number(tmp_prev.data.value || 0);
                            if (currentValue !== prevValue) table[j][6] = -(Math.abs(currentValue-prevValue).toFixed(2));
                        }
                    }
                    test_fare -= Math.abs(table[j][6] || 0);
                    j++;
                    status = "exit";
                } else if (status === "exit") {
                    if (table[j][0] === null) table[j][0] = formattedDate;
                    let station = obj.data.xStation;
                    if (["LibraryKNUT","CentralLibrary","BaanRattana","IICP","Cinemaru","Screen","Not in use"].some(s=>station.includes(s))) continue;
                    else if (["Bus-", "KTB", "ETB", "BRT"].some(s => station.includes(s))) table[j][1] = "directions_bus";
                    else if (["Boat-"].some(s => station.includes(s))) table[j][1] = "directions_boat";
                    else table[j][1] = "directions_railway";

                    table[j][4] = true;
                    table[j][5] = obj.data.railPass;
                    table[j][6] = -(Number(obj.data.fare));
                    table[j][7] = obj.data.osi;
                    table[j][8] = formattedTime;

                    if (station.includes("KTB-")) station = await getKtbStation(station.slice(4));
                    table[j][9] = station;

                    if (Number(Math.abs(obj.data.fare)) === 0 && i>0) {
                        const tmp_prev = raw_text[i-1];
                        if (tmp_prev) {
                            const currentValue = Number(obj.data.value || 0);
                            const prevValue = Number(tmp_prev.data.value || 0);
                            if (currentValue !== prevValue) table[j][6] = -(Math.abs(currentValue-prevValue).toFixed(2));
                        }
                    }
                    test_fare -= Math.abs(table[j][6] || 0);
                    j++;
                }
                break;

            case "payment":
                if (!obj.data.station) continue;
                if (["LibraryKNUT","CentralLibrary","BaanRattana","IICP","Cinemaru","Screen","Not in use"].some(s=>obj.data.station.includes(s))) continue;

                table[j][0] = formattedDate;
                table[j][1] = "directions_railway";
                table[j][2] = formattedTime;
                table[j][3] = obj.data.station;
                table[j][5] = obj.data.railPass;
                table[j][4] = "payment_transit_tag";
                table[j][6] = -(Number(obj.data.price));

                if (["Bus-", "KTB", "ETB", "BRT"].some(s=>obj.data.station.includes(s))) table[j][1] = "directions_bus";
                else if (["Boat"].some(s=>obj.data.station.includes(s))) table[j][1] = "directions_boat";

                if (Number(Math.abs(obj.data.price)) === 0 && i>0) {
                    const tmp_prev = raw_text[i-1];
                    if (tmp_prev) {
                        const currentValue = Number(obj.data.value || 0);
                        const prevValue = Number(tmp_prev.data.value || 0);
                        if (currentValue !== prevValue) table[j][6] = -(Math.abs(currentValue-prevValue).toFixed(2));
                    }
                }
                j++;
                break;

            default:
                continue;
        }
    }
    return table;
}

// --- TRANSIT FILTER ---
function transit_filter(raw_text) {
    let start = null;
    for (let i=0; i<=raw_text.length; i++) {
        const val = raw_text[i]?.[7];
        const isTrue = val===true || val==="true";
        const isFalse = val===false || val==="false";

        if (isTrue && start===null) start=i;
        if ((isFalse || i===raw_text.length) && start!==null) {
            const end = i;
            const block = raw_text.slice(start,end+1);
            [1,2,3,8,9].forEach(idx=>{
                const values = block.map(r=>r[idx]).reverse();
                for (let k=0;k<block.length;k++) block[k][idx]=values[k];
            });
            for (let k=0;k<block.length;k++) raw_text[start+k]=block[k];
            start=null;
        }
    }
    return raw_text;
}

// --- GET KTB STATION ---
async function getKtbStation(code) {
    const resp = await fetch('https://masstransit.wasabi.winsanmwtv.me/api/ktb/station-mapping.json', {cache:"no-store"});
    const obj = await resp.json();
    for (let i=0;i<obj.data.length;i++) {
        if (Number(code) === Number(obj.data[i].ktb)) return obj.data[i].name;
    }
    return "KTB Bus Stop";
}
