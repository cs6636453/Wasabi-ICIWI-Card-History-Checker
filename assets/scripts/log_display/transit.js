async function transit_sort(raw_text) {
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

        // Parse timestamp from log
        const logDate = new Date(obj.timestamp);
        const optionsDate = { day: "2-digit", month: "short", year: "numeric" };
        const optionsTime = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false };
        switch (obj.message) {
            case "card-entry":
                if (status === "exit") {
                    const station = obj.data.nStation;
                    if (["Bus", "KTB", "ETB", "BRT"].some(s => station.includes(s))) {
                        table[j][1] = "directions_bus";
                    } else if (["LibraryKNUT", "CentralLibrary", "BaanRattana", "IICP", "Cinemaru"].some(s => station.includes(s))) {
                        continue; // skip this row
                    } else {
                        table[j][1] = "directions_railway";
                    }
                    table[j][0] = logDate.toLocaleDateString(undefined, optionsDate);
                    table[j][2] = logDate.toLocaleTimeString(undefined, optionsTime);
                    table[j][3] = station;
                    status = "entry";
                } else if (status === "entry") {
                    const station = obj.data.nStation;
                    if (["LibraryKNUT", "CentralLibrary", "BaanRattana", "IICP", "Cinemaru"].some(s => station.includes(s))) {
                        continue; // skip this row
                    }
                    table[j][4] = true;
                    j++;

                    if (["Bus", "KTB", "ETB", "BRT"].some(s => station.includes(s))) {
                        table[j][1] = "directions_bus";
                    } else if (["LibraryKNUT", "CentralLibrary", "BaanRattana", "IICP", "Cinemaru"].some(s => station.includes(s))) {
                        continue; // skip this row
                    } else {
                        table[j][1] = "directions_railway";
                    }
                    table[j][0] = logDate.toLocaleDateString(undefined, optionsDate);
                    table[j][2] = logDate.toLocaleTimeString(undefined, optionsTime);
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
                    const station = obj.data.xStation;
                    if (["LibraryKNUT", "CentralLibrary", "BaanRattana", "IICP", "Cinemaru"].some(s => station.includes(s))) {
                        continue; // skip this row
                    }
                    table[j][4] = false;
                    table[j][5] = obj.data.railPass;
                    table[j][6] = -(Number(obj.data.fare));
                    table[j][7] = obj.data.osi;
                    table[j][8] = logDate.toLocaleTimeString(undefined, optionsTime);

                    table[j][9] = obj.data.xStation;

                    if (Number(obj.data.fare) === 0 && i < rowCount - 1) {
                        const tmp_next = raw_text[i+1];
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
                    if (table[j][0] === null) table[j][0] = logDate.toLocaleTimeString(undefined, optionsDate);
                    const station = obj.data.xStation;
                    if (["LibraryKNUT", "CentralLibrary", "BaanRattana", "IICP", "Cinemaru"].some(s => station.includes(s))) {
                        continue; // skip this row
                    }
                    table[j][4] = true;
                    table[j][5] = obj.data.railPass;
                    table[j][6] = -(Number(obj.data.fare));
                    table[j][7] = obj.data.osi;
                    table[j][8] = logDate.toLocaleTimeString(undefined, optionsTime);

                    table[j][9] = obj.data.xStation;

                    if (Number(obj.data.fare) === 0 && i < rowCount - 1) {
                        const tmp_next = raw_text[i+1];
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
            case "new-card":
            case "refund-card":
            case "top-up-card":
            default:
                continue;
        }
    }


    return table;
}