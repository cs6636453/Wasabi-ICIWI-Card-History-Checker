function getCookie(name) {
    const m = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'));
    return m ? decodeURIComponent(m[2]) : null;
}

async function fetch_log() {
    const serial = getCookie('iciwi_serial');

    try {
        const resp = await fetch("../../../../iciwi.log", { cache: "no-store" });
        if (!resp.ok) throw new Error("Failed to fetch iciwi.log: " + resp.status);

        const text = await resp.text();
        const lines = text.split("\n");

        const allowedMessages = new Set([
            "new-card",
            "top-up-card",
            "refund-card",
            "card-entry",
            "card-exit",
            "payment"
        ]);

        const matchedObjects = [];

        let buffer = "";

        for (const line of lines) {
            buffer += line; // accumulate lines

            try {
                const obj = JSON.parse(buffer);

                // check message and serial
                const objSerial = obj.data?.serial ?? obj.data?.card; // fallback to 'card' if 'serial' doesn't exist
                if (allowedMessages.has(obj.message) && objSerial === serial) {
                    matchedObjects.push({
                        timestamp: obj.timestamp,
                        message: obj.message,
                        data: obj.data
                    });
                }

                buffer = ""; // reset buffer after successful parse
            } catch {
                buffer += "\n"; // incomplete JSON, continue accumulating
            }
        }

        let parsed_text = await payment_sort(matchedObjects);

        // 1. Remove rows where all columns are null
        parsed_text = parsed_text.filter(
            row => Array.isArray(row) && row.some(col => col !== null)
        );

        // 2. Flip (reverse) the order of rows
        parsed_text = parsed_text.reverse();


        let parsed_text_transit = await transit_sort(matchedObjects);

        // 1. Remove rows where all columns are null
        parsed_text_transit = parsed_text_transit.filter(
            row => Array.isArray(row) && row.some(col => col !== null)
        );

        // 2. Flip (reverse) the order of rows
        parsed_text_transit = parsed_text_transit.reverse();

        parsed_text_transit = transit_filter(parsed_text_transit);

        let name = "WASABI HOLDER";
        let is_name_checked = false;

        let balance = 0;
        for (let i = 0; i < parsed_text.length; i++) {
            if (parsed_text[i][3] === "Issue card" && is_name_checked === false) {
                name = parsed_text[i][4];
                is_name_checked = true;
            }
            balance += (parsed_text[i][5] ? parsed_text[i][5] : 0);
        }

        let type = parsed_text[0][3];
        let exp = parsed_text[0][1]; // "29 Jan 2025"

// Parse the date
        let date = new Date(exp);

// Add 5 years
        date.setFullYear(date.getFullYear() + 5);

// Format as "01/MM/YYYY"
        let month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-indexed
        let year = date.getFullYear();

        let result = `01/${month}/${year}`;

        result = "Exp. "+result.slice(3);

        // console.log(parsed_text);
        // console.log(parsed_text_transit);

        payment_render(parsed_text);
        transit_render(parsed_text_transit);

        card_render(type, balance, result, serial, name);

        const loader_payment = document.getElementById("loader_payment");
        loader_payment.classList.add("hidden");

        const loader_transit = document.getElementById("loader_transit");
        loader_transit.classList.add("hidden");

    } catch(e) {
        // console.log(e);
        const serial = getCookie('iciwi_serial');
        card_render_invalid(serial)



        const loader_payment = document.getElementById("loader_payment");
        loader_payment.classList.add("hidden");

        const loader_transit = document.getElementById("loader_transit");
        loader_transit.classList.add("hidden");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    fetch_log();
});
