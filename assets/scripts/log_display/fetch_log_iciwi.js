async function fetch_log(serial) {
    try {
        console.log(serial);
        const resp = await fetch("../../../Iciwi/iciwi.log", { cache: "no-store" });
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
            buffer += line;

            try {
                const obj = JSON.parse(buffer);

                const objSerial = obj.data?.serial ?? obj.data?.card;
                if (allowedMessages.has(obj.message) && objSerial === serial) {
                    matchedObjects.push({
                        timestamp: obj.timestamp,
                        message: obj.message,
                        data: obj.data
                    });
                }

                buffer = "";
            } catch {
                buffer += "\n";
            }
        }

        let parsed_table = await payment_sort(matchedObjects);

        // Remove rows where all columns are null
        parsed_table = parsed_table.filter(
            row => Array.isArray(row) && row.some(col => col !== null)
        );

        // Reverse order
        parsed_table.reverse();

        appendToTable(parsed_table);

        console.log(parsed_table);

        // ✅ Correct way to hide loader
        const loader2 = document.getElementById('loader-overlay-2');
        if (loader2) {
            loader2.style.display = 'none';
            loader2.classList.add('loaded-2');
        }

    } catch(e) {
        console.error(e);
        const serial = getCookie('iciwi_serial');
        card_render_invalid(serial);

        const loader_payment = document.getElementById("loader_payment");
        loader_payment?.classList.add("hidden");

        const loader_transit = document.getElementById("loader_transit");
        loader_transit?.classList.add("hidden");
    }
}
