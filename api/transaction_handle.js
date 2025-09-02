// transaction_handle.js
"use strict";

window.addEventListener("load", init);

async function init() {
    const overlay = document.getElementById("loading_overlay");
    if (overlay) overlay.style.display = "flex";

    try {
        const cardSerial = getCardFromUrlOrCookie();
        if (!cardSerial) { console.error("No card provided."); showNotFound(); return; }

        const raw = await fetchLog("../../../resources/iciwi.log");
        const parsed = parseLog(raw);

        if (!parsed.length) { console.warn("No entries in log"); showNotFound(); return; }

        // Filter to this card
        const logsForCard = parsed.filter(e => e.data && (e.data.serial === cardSerial || e.data.card === cardSerial));

        if (!logsForCard.length) { console.warn("No logs for card:", cardSerial); showNotFound(); return; }

        // Normalize timestamps into Date objects
        logsForCard.forEach(e => {
            e._date = parseTimestampToUTCDate(e.timestamp);
            e._timeNum = e._date.getTime();
        });

        // Sort ascending for pairing (oldest -> newest)
        logsForCard.sort((a, b) => a._timeNum - b._timeNum);

        // Pair entries/exits and compute fares + balance adjustments
        const { trips, syntheticAdjustments } = buildTripsAndAdjustments(logsForCard);

        // Build transactions list
        const transactions = buildTransactions(logsForCard, trips, syntheticAdjustments);

        // Render
        renderTransactions(transactions);
        renderTrips(trips);

        // Update card UI
        const digitEl = document.getElementById("card_digit_behind");
        const balanceEl = document.getElementById("card_digit_balance");
        if (digitEl) digitEl.textContent = "• " + cardSerial.slice(-4);

        // latest balance
        const rev = logsForCard.slice().reverse();
        const latestValEntry = rev.find(e => e.data && (e.data.value !== undefined || e.data.old !== undefined));
        let latestBalance = null;
        if (latestValEntry) {
            if (latestValEntry.data.value !== undefined) latestBalance = Number(latestValEntry.data.value);
            else if (latestValEntry.data.old !== undefined && latestValEntry.data.change !== undefined)
                latestBalance = Number(latestValEntry.data.old) + Number(latestValEntry.data.change);
            else if (latestValEntry.data.change !== undefined) latestBalance = Number(latestValEntry.data.change);
        }
        if (balanceEl) balanceEl.textContent = latestBalance === null ? "£ 0.00" : "£ " + Number(latestBalance).toFixed(2);

    } catch (err) {
        console.error("Failed to process logs:", err);
        showNotFound();
    } finally {
        if (overlay) overlay.style.display = "none";
    }
}

/* ---------- Helpers ---------- */

function getCardFromUrlOrCookie() {
    const urlParams = new URLSearchParams(window.location.search);
    const card = urlParams.get("card");
    if (card) return card;
    return getCookie("iciwi_serial");
}

async function fetchLog(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch log: " + res.status);
    return await res.text();
}

// Robust JSON parser that skips invalid chunks but keeps the rest
function parseLog(raw) {
    if (!raw || !raw.trim()) return [];

    const results = [];
    const len = raw.length;
    let depth = 0;
    let startIdx = -1;

    for (let i = 0; i < len; i++) {
        const ch = raw[i];
        if (ch === "{") { if (depth === 0) startIdx = i; depth++; }
        else if (ch === "}") {
            depth = Math.max(0, depth - 1);
            if (depth === 0 && startIdx !== -1) {
                const substr = raw.slice(startIdx, i + 1).trim();
                startIdx = -1;
                try { results.push(JSON.parse(substr)); }
                catch (e) { console.warn("Skipped invalid JSON chunk:", substr.slice(0, 200)); }
            }
        }
    }

    if (depth > 0) console.warn("File ended while JSON braces still open.");

    console.info(`parseLog: parsed ${results.length} JSON objects.`);
    return results;
}

function parseTimestampToUTCDate(ts) {
    if (typeof ts !== "string") return new Date(ts);
    const trimmed = ts.trim();
    if (/T/.test(trimmed) || /Z|[+\-]\d{2}:\d{2}$/.test(trimmed)) return new Date(trimmed);
    const iso = trimmed.replace(" ", "T") + "Z";
    return new Date(iso);
}

function showNotFound() {
    const trans = document.getElementById("transaction_page");
    const trips = document.getElementById("trip_history_page");
    if (trans) trans.innerHTML = `<div style="text-align:center;margin:50px;">This card is not found.<br>Please unbind this card and try again.</div>`;
    if (trips) trips.innerHTML = "";
    const balanceEl = document.getElementById("card_digit_balance");
    if (balanceEl) balanceEl.textContent = "£ 0.00";
}

/* ---------- Trip & Fare Logic ---------- */

function buildTripsAndAdjustments(logsAsc) {
    const trips = [];
    const syntheticAdjustments = [];
    const entryStack = [];

    for (let i = 0; i < logsAsc.length; i++) {
        const e = logsAsc[i];

        if (e.message === "card-entry") entryStack.push({ entryLog: e, matched: false });
        else if (e.message === "card-exit") {
            let foundIdx = entryStack.map((v, idx) => !v.matched ? idx : -1).filter(idx => idx !== -1).pop();
            if (foundIdx !== undefined) {
                const pair = entryStack[foundIdx];
                pair.matched = true;
                const entryLog = pair.entryLog;
                const exitLog = e;

                const entryVal = safeNumber(entryLog?.data?.value);
                const exitVal = safeNumber(exitLog?.data?.value);
                let fare = (isNumber(entryVal) && isNumber(exitVal)) ? Math.abs(entryVal - exitVal) : 0;

                // fallback if fare 0
                if (fare === 0 && logsAsc[i + 1]?.data) {
                    const nextVal = safeNumber(logsAsc[i + 1].data.value ?? (logsAsc[i + 1].data.old + logsAsc[i + 1].data.change));
                    if (isNumber(exitVal) && isNumber(nextVal)) fare = Math.abs(exitVal - nextVal);
                }

                trips.push({ entry: entryLog, exit: exitLog, fare, exitTimeNum: exitLog._timeNum });

                // balance adjustment
                const nextEv = logsAsc[i + 1];
                if (nextEv && isNumber(exitVal)) {
                    const nextVal = safeNumber(nextEv.data?.value ?? (nextEv.data?.old + nextEv.data?.change));
                    if (isNumber(nextVal)) {
                        const diff = Number(nextVal) - Number(exitVal);
                        if (Math.abs(diff) > 0) {
                            syntheticAdjustments.push({
                                timestamp: nextEv.timestamp,
                                _date: nextEv._date,
                                amount: diff,
                                reason: "Balance adjustment",
                                linkedExitTimeNum: exitLog._timeNum
                            });
                        }
                    }
                }
            } else {
                trips.push({ entry: null, exit: e, fare: safeNumber(e.data?.fare) ?? 0, exitTimeNum: e._timeNum });
            }
        }
    }

    // unmatched entries
    entryStack.filter(e => !e.matched).forEach(e => trips.push({ entry: e.entryLog, exit: null, fare: 0, exitTimeNum: e.entryLog._timeNum }));

    // sort by most recent
    trips.sort((a, b) => (b.exitTimeNum || a.entry?._timeNum || 0) - (a.exitTimeNum || b.entry?._timeNum || 0));

    return { trips, syntheticAdjustments };
}

/* ---------- Transactions ---------- */

function buildTransactions(logsAsc, trips, syntheticAdjustments) {
    const txs = [];

    // Base transactions from logs
    logsAsc.forEach((e, i) => {
        const tsDate = e._date;
        const dateStr = formatDateOnly(tsDate);
        const timeStr = formatTimeOnly(tsDate);
        let text = "", icon = "storefront", amount = 0;

        switch (e.message) {
            case "new-card": text="Purchase a card - ICIWI"; icon="add_card"; amount=safeNumber(e.data?.value); break;
            case "top-up-card": text="Add value - ICIWI"; icon="currency_pound"; amount=safeNumber(e.data?.change); break;
            case "payment": text="Payment - Entetsu Bus"; icon="direction_bus"; amount=-safeNumber(e.data?.price); break;
            case "card-entry": text="Card validation - ICIWI"; icon="done_all"; amount=0; break;
            case "card-exit": text="Payment - KTB/TJT"; icon="train"; amount=null; break;
            case "refund-card": text="Card returned - ICIWI"; icon="credit_card_off"; amount=-safeNumber(e.data?.value); break;
            default: text=e.message || "Unknown"; icon="storefront"; amount=0;
        }

        txs.push({ id:i, raw:e, timestamp:tsDate, dateStr, timeStr, text, icon, amount, className:"" });
    });

    // Merge Out-of-station interchange if exit + next entry within 5 minutes
    for (let i = 0; i < txs.length - 1; i++) {
        const curr = txs[i];
        const next = txs[i+1];

        if (curr.raw.message === "card-exit" && next.raw.message === "card-entry") {
            const diff = next.timestamp - curr.timestamp;
            if (diff <= 5*60*1000) {
                // Determine amount: use exit fare if available from trips
                let exitFare = 0;
                const trip = trips.find(t => t.exit && t.exit._timeNum === curr.raw._timeNum);
                if (trip && trip.fare) exitFare = -Number(trip.fare);

                // Include any synthetic adjustments linked to this exit
                const adjustments = syntheticAdjustments
                    .filter(sa => sa.linkedExitTimeNum === curr.raw._timeNum);
                const adjAmount = adjustments.reduce((sum, adj) => sum + Number(adj.amount || 0), 0);

                const mergedTx = {
                    id: txs.length,
                    raw: { exit: curr.raw, entry: next.raw },
                    timestamp: next.timestamp,
                    dateStr: formatDateOnly(next.timestamp),
                    timeStr: formatTimeOnly(next.timestamp),
                    text: "Out-of-station interchange",
                    icon: "transfer_within_a_station",
                    amount: exitFare + adjAmount,
                    className: exitFare + adjAmount > 0 ? "history_fare_positive" : "history_fare_negative"
                };

                // Replace the original exit + entry with merged transaction
                txs.splice(i, 2, mergedTx);
            }
        }
    }

    // Map trips to exit transactions and include balance adjustments
    trips.forEach(trip => {
        if (!trip.exit) return;

        const exitTimeNum = trip.exit._timeNum;
        const txIdx = txs.findIndex(t => t.raw._timeNum === exitTimeNum && t.raw.message === "card-exit");
        const amount = -Number(trip.fare || 0);

        if (txIdx !== -1) {
            txs[txIdx].amount = amount;
            txs[txIdx].text = "Payment - KTB/TJT";
            txs[txIdx].icon = "train";
        }

        // Add balance adjustments if any
        syntheticAdjustments
            .filter(sa => sa.linkedExitTimeNum === exitTimeNum)
            .forEach(adj => {
                txs.push({
                    id: txs.length,
                    raw: { _date: adj._date, timestamp: adj.timestamp },
                    timestamp: adj._date,
                    dateStr: formatDateOnly(adj._date),
                    timeStr: formatTimeOnly(adj._date),
                    text: "Balance adjustment - ICIWI",
                    icon: "currency_exchange",
                    amount: Number(adj.amount || 0),
                    className: (Number(adj.amount || 0) > 0) ? "history_fare_positive" : "history_fare_negative"
                });
            });
    });

    // Assign class for styling and fix null amounts
    txs.forEach(t => {
        if (t.amount === null || t.amount === undefined) t.amount = 0;
        t.className = t.amount > 0 ? "history_fare_positive" : "history_fare_negative";
    });

    // Sort most recent first
    txs.sort((a, b) => b.timestamp - a.timestamp);
    txs.forEach(t => t.amount = Number(t.amount) || 0);

    return txs;
}

/* ---------- Rendering ---------- */

function renderTransactions(transactions) {
    const table = document.getElementById("transaction_history");
    if (!table) return;
    table.innerHTML = "";

    transactions.forEach(tx => {
        const tr = document.createElement("tr");
        tr.className = "log";

        const iconTd = document.createElement("td");
        iconTd.className = "history_icon";
        iconTd.innerHTML = `<span class="material-symbols-outlined size-24">${escapeHtml(tx.icon)}</span>`;

        const textTd = document.createElement("td");
        textTd.colSpan = 3;
        textTd.className = "history_text";
        textTd.innerHTML = `<p class="transaction_date">${tx.dateStr} | ${tx.timeStr}</p>
                        <p class="transaction_name">${escapeHtml(tx.text)}</p>`;

        const fareTd = document.createElement("td");
        fareTd.colSpan = 2;
        fareTd.className = tx.amount > 0 ? "history_fare_positive" : "history_fare_negative";
        const absVal = Math.abs(Number(tx.amount || 0)).toFixed(2);
        const sign = (tx.amount > 0) ? "+ £ " : "- £ ";
        fareTd.textContent = sign + absVal;

        tr.appendChild(iconTd);
        tr.appendChild(textTd);
        tr.appendChild(fareTd);
        table.appendChild(tr);
    });
}

function renderTrips(trips) {
    const container = document.getElementById("trip_history_page");
    if (!container) return;
    container.innerHTML = "";

    if (!trips.length) {
        container.innerHTML = `<div style="text-align:center;margin:40px;">No trip history</div>`;
        return;
    }

    // Group by date
    const byDate = {};
    trips.forEach(trip => {
        const repDate = trip.exit ? trip.exit._date : (trip.entry ? trip.entry._date : new Date());
        const dateKey = formatDateOnly(repDate);
        if (!byDate[dateKey]) byDate[dateKey] = [];
        byDate[dateKey].push(trip);
    });

    const dateKeys = Object.keys(byDate).sort((a,b) => parseDateOnlyToDate(b) - parseDateOnlyToDate(a));

    dateKeys.forEach(dateKey => {
        const h1 = document.createElement("h1");
        h1.className = "trip_date";
        h1.textContent = dateKey;
        container.appendChild(h1);

        const dayTrips = byDate[dateKey].sort((a,b) => (b.exit?._timeNum || b.entry?._timeNum) - (a.exit?._timeNum || a.entry?._timeNum));

        dayTrips.forEach(trip => {
            const entryTime = trip.entry ? formatTimeOnly(trip.entry._date, true) : "Invalid";
            const entryStation = trip.entry?.data?.nStation || trip.entry?.data?.station || "Invalid";
            const exitTime = trip.exit ? formatTimeOnly(trip.exit._date, true) : "Invalid";
            const exitStation = trip.exit?.data?.xStation || trip.exit?.data?.station || "Invalid";
            const fareText = "£ " + Number(trip.fare || 0).toFixed(2);

            const div = document.createElement("div");
            div.className = "history_card";
            div.innerHTML = `
        <div class="card_origin">
          <span class="material-symbols-outlined size-36 card_icon">subway</span>
          <p class="history_time">${escapeHtml(entryTime)}</p>
          <p class="history_station">${escapeHtml(entryStation)}</p>
        </div>
        <div class="connect_arrow"></div>
        <div class="card_destination">
          <span class="material-symbols-outlined size-36 card_icon">subway</span>
          <p class="history_time">${escapeHtml(exitTime)}</p>
          <p class="history_station">${escapeHtml(exitStation)}</p>
        </div>
        <div class="total_fare">
          <p class="history_fare">${escapeHtml(fareText)}</p>
        </div>
      `;
            container.appendChild(div);
        });
    });
}

/* ---------- Utilities ---------- */

function safeNumber(v) {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") return v;
    const n = Number(String(v).replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : null;
}
function isNumber(v) { return v !== null && v !== undefined && !Number.isNaN(Number(v)); }

function formatDateOnly(dateObj) {
    const d = new Date(dateObj);
    const dd = String(d.getDate()).padStart(2,"0");
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}
function parseDateOnlyToDate(ddmmyyyy) {
    const [dd, mm, yyyy] = ddmmyyyy.split("/").map(Number);
    return new Date(Date.UTC(yyyy, mm-1, dd));
}
function formatTimeOnly(dateObj, includeSeconds=true) {
    const d = new Date(dateObj);
    const opts = { hour12:false, hour:"2-digit", minute:"2-digit" };
    if (includeSeconds) opts.second="2-digit";
    return d.toLocaleTimeString("en-GB", Object.assign({}, opts, { timeZone:"Asia/Singapore" }));
}

function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
}