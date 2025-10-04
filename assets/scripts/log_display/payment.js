// --- PAYMENT SORT ---
async function payment_sort(raw_text) {
    const rowCount = raw_text.length;
    const colCount = 7;
    const table = Array.from({ length: rowCount }, () => Array(colCount).fill(null));

    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

    for (let i = 0; i < rowCount; i++) {
        const obj = raw_text[i];

        let icon = "storefront";
        let titleL = "Payment";
        let titleR = "KTB/TJT";
        let fare = 0;

        switch(obj.message) {
            case "card-entry":
                continue;
            case "new-card":
                icon = "checkbook";
                titleL = "Issue card";
                titleR = await getMinecraftUsername(obj.data.player);
                fare = +(Number(obj.data.value).toFixed(2));
                break;
            case "refund-card":
                icon = "credit_card_off";
                titleL = "Refund card";
                titleR = "ICIWI";
                fare = -((Number(obj.data.value)).toFixed(2));
                break;
            case "top-up-card":
                icon = "add_card";
                titleL = "Charge";
                titleR = "KTB/TJT";
                fare = +(Number(obj.data.change).toFixed(2));
                break;
            case "card-exit":
                icon = "tram";
                titleL = "Transit";
                titleR = obj.data.xStation;
                fare = -((Number(obj.data.fare)).toFixed(2));

                const station = obj.data.xStation;
                if (["Bus-", "KTB", "ETB", "BRT"].some(s => station.includes(s))) {
                    icon = "directions_bus";
                    titleL = "Bus payment";
                    titleR = "KTB/ETB";
                } else if (["Boat-"].some(s => station.includes(s))) {
                    icon = "directions_boat";
                    titleL = "Ferry payment";
                    titleR = '["IPID"=21]';
                } else if (["IICP", "Cinemaru", "Screen"].some(s => station.includes(s))) {
                    icon = "storefront";
                    titleL = "Merchant";
                    titleR = "CINEMARU";
                } else if (["LibraryKNUT", "CentralLibrary"].some(s => station.includes(s))) {
                    icon = "school";
                    titleL = "Education";
                    titleR = "KONNO UNIV";
                } else if (["BaanRattana", "Not in use"].some(s => station.includes(s))) {
                    continue;
                }

                const fareT = fare;

                // Correct fare check
                if (Number(Math.abs(fare)) === 0 && i > 0) {
                    const tmp_prev = raw_text[i-1];
                    if (tmp_prev) {
                        const currentValue = Number(obj.data.value || 0);
                        const prevValue = Number(tmp_prev.data.value || 0);
                        if (currentValue !== prevValue) {
                            fare = -(Math.abs(currentValue - prevValue).toFixed(2));
                            titleL = "Missing payment";
                            titleR = "Wasabi";
                            icon = "payment_card";
                        }
                    }
                }

                if (Number(Math.abs(fareT)) === 0 && i < rowCount - 1) {
                    const tmp_next = raw_text[i+1];
                    if (tmp_next) {
                        const currentValue = Number(obj.data.value || 0);
                        const nextValue = Number(tmp_next.data.value || 0);
                        if (currentValue !== nextValue) {
                            fare += -(Math.abs(currentValue - nextValue).toFixed(2));
                            titleL = "Missing payment";
                            titleR = "Wasabi";
                            icon = "payment_card";
                        }
                    }
                }

                break;
            case "payment":
                icon = "storefront";
                titleL = "Merchant";
                titleR = obj.data.station || '["IPID"=27]';
                fare = -((Number(obj.data.price)).toFixed(2));

                if (["Bus-", "KTB", "ETB", "BRT"].some(s => titleR.includes(s))) {
                    icon = "directions_bus";
                    titleL = "Bus payment";
                } else if (["Boat-"].some(s => titleR.includes(s))) {
                    icon = "directions_boat";
                    titleL = "Ferry payment";
                }
                break;
            default:
                continue;
        }

        table[i][0] = icon;

        // Format log date as "22 Sep 2025" (English, 3-letter month)
        const logDate = new Date(obj.timestamp);
        const day = String(logDate.getDate()).padStart(2, "0");
        const month = monthNames[logDate.getMonth()];
        const year = logDate.getFullYear();
        table[i][1] = `${day} ${month} ${year}`;

        // Format time as "22:29" (24-hour)
        const hours = String(logDate.getHours()).padStart(2, "0");
        const minutes = String(logDate.getMinutes()).padStart(2, "0");
        table[i][2] = `${hours}:${minutes}`;

        table[i][3] = titleL;
        table[i][4] = titleR;
        table[i][5] = fare;
        table[i][6] = await getMinecraftUsername(obj.data.player || "WASABI CARD HOLDER");
    }

    // Remove rows that were skipped
    return table.filter(row => row[0] !== null);
}

// --- MINECRAFT USERNAME FETCH ---
async function getMinecraftUsername(uuid) {
    try {
        const cleanUUID = uuid.replace(/-/g, "");
        const resp = await fetch(`https://api.ashcon.app/mojang/v2/user/${cleanUUID}`);
        if (!resp.ok) throw new Error("Failed to fetch username");
        const data = await resp.json();
        return data.username;
    } catch (err) {
        console.error(err);
        return uuid;
    }
}