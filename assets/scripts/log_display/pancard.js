async function payment_sort(raw_text) {
    const tableData = [];

    for (let i = 0; i < raw_text.length; i++) {
        const obj = raw_text[i];
        const logDate = new Date(obj.timestamp);

        const optionsDate = { day: "2-digit", month: "2-digit", year: "numeric" };
        const optionsTime = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false };

        const timestampStr = logDate.toLocaleDateString('en-GB', optionsDate) + " " + logDate.toLocaleTimeString('en-GB', optionsTime);

        let station

        if (obj.data.station) {
            station = obj.data.station;
        } else if (obj.data.xStation) {
            station = obj.data.xStation;
        } else if (obj.data.nStation) {
            station = obj.data.nStation;
        } else {
            station = "NULL";
        }

        let fare = 0;
        if (Number(obj.data.fare)) {
            fare = Number(obj.data.fare);
        } else if (Number(obj.data.change)) {
            fare = Number(obj.data.change).toFixed(2);
        } else {
            const tmp_next = raw_text[i + 1];
            if (tmp_next) {
                const currentValue = Number(obj.data.value || obj.data.change || 0);
                const nextValue = Number(tmp_next.data.value || obj.data.change || 0);
                if (currentValue !== nextValue) {
                    fare = (currentValue - nextValue).toFixed(2);
                }
            }
        }

        let balanceLeft = 0;

        if (obj.data.value) {
            balanceLeft = (Number(obj.data.value || 0) - Number(fare)).toFixed(2);
        } else if (obj.data.change) {
            balanceLeft = (Number(obj.data.change || 0) + Number(obj.data.old)).toFixed(2);
        }
        tableData.push([timestampStr, station, obj.message, fare, balanceLeft]);
    }

    return tableData;
}

// Append the processed rows to your table
function appendToTable(parsed_table) {
    const table = document.getElementById("result");

    parsed_table.forEach(row => {
        const tr = document.createElement("tr");
        row.forEach(cell => {
            const td = document.createElement("td");
            td.textContent = cell;
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });

    const h3 = document.getElementById("balance");
    parsed_table[0][4] ? h3.innerHTML = "Balance: " + parsed_table[0][4] : "" ;
}