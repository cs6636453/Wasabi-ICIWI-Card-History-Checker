async function payment_sort(raw_text) {
    const rowCount = raw_text.length;
    const colCount = 6;
    const table = Array.from({ length: rowCount }, () => Array(colCount).fill(null));

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
                titleR = await getMinecraftUsername(obj.data.player); // now works
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

                // Check xStation with multiple substrings
                const station = obj.data.xStation;

                if (["Bus", "KTB", "ETB", "BRT"].some(s => station.includes(s))) {
                    icon = "directions_bus";
                    titleL = "Bus payment";
                    titleR = "KTB/ETB";
                } else if (["IICP", "Cinemaru"].some(s => station.includes(s))) {
                    icon = "storefront";
                    titleL = "Merchant";
                    titleR = "CINEMARU";
                } else if (["LibraryKNUT", "CentralLibrary"].some(s => station.includes(s))) {
                    icon = "school";
                    titleL = "Education";
                    titleR = "KONNO UNIV";
                } else if (station.includes("BaanRattana")) {
                    continue; // skip this row
                }

                // Correct fare check
                if (Number(fare) === 0 && i < rowCount - 1) {
                    const tmp_next = raw_text[i+1];
                    if (tmp_next) {
                        const currentValue = Number(obj.data.value || 0);
                        const nextValue = Number(tmp_next.data.value || 0);

                        if (currentValue !== nextValue) {
                            fare = -(Math.abs(currentValue - nextValue).toFixed(2));
                            titleL = "Pay by debit";
                            icon = "account_balance_wallet";
                        }
                    }
                }

                break;
            case "payment":
                icon = "storefront";
                titleL = "Merchant";
                titleR = '["IPID"=27]';
                fare = -((Number(obj.data.price)).toFixed(2));
                break;
            default:
                continue;
        }

        table[i][0] = icon; // icon

        // Parse timestamp from log
        const logDate = new Date(obj.timestamp);

        // Format date as "22 Sep 2025"
        const optionsDate = { day: "2-digit", month: "short", year: "numeric" };
        table[i][1] = logDate.toLocaleDateString(undefined, optionsDate);

        // Format time as "22:29" (24-hour)
        const optionsTime = { hour: "2-digit", minute: "2-digit", hour12: false };
        table[i][2] = logDate.toLocaleTimeString(undefined, optionsTime);

        table[i][3] = titleL; // description 1
        table[i][4] = titleR; // description 2
        table[i][5] = fare;   // fare
    }

    return table;
}

// Async function to get username from Ashcon API
async function getMinecraftUsername(uuid) {
    try {
        const cleanUUID = uuid.replace(/-/g, "");
        const resp = await fetch(`https://api.ashcon.app/mojang/v2/user/${cleanUUID}`);
        if (!resp.ok) throw new Error("Failed to fetch username");

        const data = await resp.json();
        return data.username; // current Minecraft username
    } catch (err) {
        console.error(err);
        return uuid; // fallback to UUID if fetch fails
    }
}