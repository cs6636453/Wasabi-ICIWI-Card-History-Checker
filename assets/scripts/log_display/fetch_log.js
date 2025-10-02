async function fetch_log() {
    const serial = getCookie("iciwi_serial");

    try {
        const resp = await fetch("https://bluemap.limaru.net/iciwi.log", { cache: "no-store" });
        if (!resp.ok) throw new Error("Failed to fetch iciwi.log: " + resp.status);

        const htmlText = await resp.text();

        // --- Step 1: Extract log from HTML ---
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        // assuming the log is inside <pre> or <body>, adjust if needed
        let logText = doc.querySelector("pre")?.textContent ?? doc.body.textContent ?? "";

        if (!logText.trim()) {
            console.warn("No log text found in HTML");
            payment_render([]);
            transit_render([]);
            card_render_invalid(serial);
            document.getElementById("loader_payment")?.classList.add("hidden");
            document.getElementById("loader_transit")?.classList.add("hidden");
            return;
        }

        // --- Step 2: Split by newline and parse each JSON object ---
        const logs = logText
            .trim()
            .split("\n")
            .map(line => {
                try {
                    return JSON.parse(line);
                } catch (err) {
                    console.warn("Failed to parse line as JSON:", line, err);
                    return null;
                }
            })
            .filter(obj => obj !== null);

        // --- Step 3: Filter by allowed messages + serial ---
        const allowedMessages = new Set([
            "new-card",
            "top-up-card",
            "refund-card",
            "card-entry",
            "card-exit",
            "payment"
        ]);

        const matchedObjects = logs.filter(obj => {
            const objSerial = obj.data?.serial ?? obj.data?.card;
            return allowedMessages.has(obj.message) && objSerial === serial;
        });

        if (!matchedObjects.length) {
            console.warn("No matching logs for serial:", serial);
            payment_render([]);
            transit_render([]);
            card_render_invalid(serial);
            document.getElementById("loader_payment")?.classList.add("hidden");
            document.getElementById("loader_transit")?.classList.add("hidden");
            return;
        }

        // --- Step 4: Process payments + transit ---
        let parsed_text = [];
        let parsed_text_transit = [];

        try {
            parsed_text = await payment_sort(matchedObjects);
            parsed_text = parsed_text
                .filter(row => Array.isArray(row) && row.some(col => col !== null))
                .reverse();
        } catch (err) {
            console.error("Error in payment_sort:", err);
        }

        try {
            parsed_text_transit = await transit_sort(matchedObjects);
            parsed_text_transit = parsed_text_transit
                .filter(row => Array.isArray(row) && row.some(col => col !== null))
                .reverse();
            parsed_text_transit = transit_filter(parsed_text_transit);
        } catch (err) {
            console.error("Error in transit_sort/transit_filter:", err);
        }

        // --- Step 5: Extract card info ---
        let name = "WASABI HOLDER";
        let is_name_checked = false;
        let balance = 0;

        for (let i = 0; i < parsed_text.length; i++) {
            if (parsed_text[i][3] === "Issue card" && !is_name_checked) {
                name = parsed_text[i][4];
                is_name_checked = true;
            }
            balance += parsed_text[i][5] ? parsed_text[i][5] : 0;
        }

        const type = parsed_text[0]?.[3] ?? "Unknown";
        const exp = parsed_text[0]?.[1];

        let result = "Exp. N/A";
        if (exp) {
            const date = new Date(exp);
            date.setFullYear(date.getFullYear() + 5);
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const year = date.getFullYear();
            result = `Exp. ${month}/${year}`;
        }

        // --- Step 6: Render ---
        payment_render(parsed_text);
        transit_render(parsed_text_transit);
        card_render(type, balance, result, serial, name);

        document.getElementById("loader_payment")?.classList.add("hidden");
        document.getElementById("loader_transit")?.classList.add("hidden");

    } catch (e) {
        console.error("Log fetch/parse error:", e);
        card_render_invalid(serial);
        document.getElementById("loader_payment")?.classList.add("hidden");
        document.getElementById("loader_transit")?.classList.add("hidden");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    fetch_log();
});