// iciwi-parser-fixed-v2.js

let actual_serial;
(function () {
    'use strict';

    // ---------- helpers ----------
    function getCookie(name) {
        const m = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]*)'));
        return m ? decodeURIComponent(m[2]) : null;
    }

    function parseLogObjects(text) {
        const objs = [];
        const re = /{[\s\S]*?}\s*(?=\n\{|$)/g;
        let m;
        while ((m = re.exec(text)) !== null) {
            try {
                objs.push(JSON.parse(m[0]));
            } catch (err) {
                console.warn('Skipping broken JSON object in iciwi.log:', err);
            }
        }
        return objs;
    }

    function parseUTCDate(ts) {
        if (!ts) return null;
        try {
            const normalized = ts.includes('T') ? (ts.endsWith('Z') ? ts : ts + 'Z') : ts.replace(' ', 'T') + 'Z';
            const d = new Date(normalized);
            return isNaN(d) ? null : d;
        } catch (e) {
            return null;
        }
    }

    function fmtDateLocalFromDate(dateObj) {
        if (!dateObj) return '';
        return dateObj.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
    }

    function fmtTimeLocalFromDate(dateObj, withSeconds = false) {
    if (!dateObj) return '';
    const opts = { hour: '2-digit', minute: '2-digit', hour12: false };
    if (withSeconds) opts.second = '2-digit';
    return dateObj.toLocaleTimeString([], opts);
}

    // normalize osi (always return string 'true'/'false' or '' if missing)
    function normalizeOsi(raw) {
        if (typeof raw === 'undefined' || raw === null) return '';
        // accepts boolean, string 'true'/'false', or other truthy values
        return String(raw).toLowerCase() === 'true' || raw === true ? 'true' : 'false';
    }

    // ---------- main ----------
    async function loadICIWILog() {
        const serial = getCookie('iciwi_serial');

        actual_serial = serial;
        if (!serial) {
            console.error('iciwi-parser-fixed-v2: cookie "iciwi_serial" not found.');
            return;
        }

        try {
            const resp = await fetch('localdata/iciwi.log', {cache: 'no-store'});
            if (!resp.ok) throw new Error('Failed to fetch iciwi.log: ' + resp.status);
            const text = await resp.text();

            const raw = parseLogObjects(text);

            // normalize raw items with parsed Date and keep original index
            const items = raw.map((obj, idx) => {
                const ts = obj.timestamp || (obj.data && obj.data.timestamp) || '';
                const d = parseUTCDate(ts);
                return {
                    raw: obj,
                    originalIndex: idx,
                    tsString: ts,
                    tsDate: d,
                    message: obj.message,
                    data: obj.data || {}
                };
            }).filter(i => i.tsDate !== null);

            // filter events for this card (match serial/card/card_id)
            const cardEvents = items.filter(i => {
                const dd = i.data || {};
                return String(dd.serial || '') === String(serial)
                    || String(dd.card || '') === String(serial)
                    || String(dd.card_id || '') === String(serial);
            });

            // sort chronological ascending for pairing & heuristics
            cardEvents.sort((a, b) => a.tsDate - b.tsDate);

            // ---------------- PAYMENTS ----------------
            const paymentsChron = [];

            for (let i = 0; i < cardEvents.length; i++) {
                const it = cardEvents[i];
                const m = it.message;
                const d = it.data || {};

                let type = m;
                if (m === 'card-exit') type = 'exit';
                else if (m === 'card-entry') type = 'entry';
                else if (m === 'top-up-card') type = 'top-up-card';
                else if (m === 'new-card') type = 'new-card';
                else if (m === 'refund-card') type = 'refund-card';
                else if (m === 'payment') type = 'payment';

                const station = d.nStation || d.xStation || d.from || d.to || d.card || '';

                const fareNum = (d.fare !== undefined && d.fare !== null) ? parseFloat(d.fare) : null;

                let balanceNum = null;
                if (d.value !== undefined && d.value !== null) balanceNum = parseFloat(d.value);
                else if (d.old !== undefined && d.change !== undefined) {
                    const oldN = parseFloat(d.old) || 0;
                    const chN = parseFloat(d.change) || 0;
                    balanceNum = oldN + chN;
                }

                let amountNum = null;
                if (d.change !== undefined && d.change !== null) amountNum = parseFloat(d.change);
                else if ((m === 'refund-card' || m === 'new-card' || m === 'payment') && d.value !== undefined) amountNum = parseFloat(d.value);
                else if (d.fare !== undefined && d.fare !== null) amountNum = parseFloat(d.fare);

                paymentsChron.push({
                    globalIdx: it.originalIndex,
                    eventIdx: i,
                    tsDate: it.tsDate,
                    timestampUtc: it.tsString,
                    type,
                    date: fmtDateLocalFromDate(it.tsDate),
                    time: fmtTimeLocalFromDate(it.tsDate, false),
                    station,
                    amount: amountNum !== null ? Number(amountNum.toFixed(2)) : '',
                    fare: fareNum !== null ? Number(fareNum.toFixed(2)) : '',
                    balance: balanceNum !== null ? Number(balanceNum.toFixed(2)) : ''
                });
            }

            // adjustments: balance rises between consecutive events without top-up-card
            for (let i = 1; i < paymentsChron.length; i++) {
                const prev = paymentsChron[i - 1];
                const cur = paymentsChron[i];
                const prevB = parseFloat(prev.balance || 0) || 0;
                const curB = parseFloat(cur.balance || 0) || 0;
                if (curB > prevB) {
                    const startGlob = prev.globalIdx;
                    const endGlob = cur.globalIdx;
                    const between = cardEvents.filter(x => x.originalIndex > startGlob && x.originalIndex <= endGlob);
                    const hasTopUp = between.some(x => x.message === 'top-up-card');
                    if (!hasTopUp) {
                        paymentsChron.splice(i, 0, {
                            globalIdx: null,
                            eventIdx: null,
                            tsDate: cur.tsDate,
                            timestampUtc: cur.timestampUtc,
                            type: 'adjustment',
                            date: fmtDateLocalFromDate(cur.tsDate),
                            time: fmtTimeLocalFromDate(cur.tsDate, false),
                            station: '',
                            amount: Number((curB - prevB).toFixed(2)),
                            fare: '',
                            balance: Number(curB.toFixed(2))
                        });
                        i++;
                    }
                }
            }

            // hold detection
            for (let i = 0; i < cardEvents.length; i++) {
                const ev = cardEvents[i];
                if (ev.message === 'card-exit') {
                    const fareNum = parseFloat(ev.data && (ev.data.fare !== undefined ? ev.data.fare : 0)) || 0;
                    if (fareNum === 0) {
                        let prevEntry = null;
                        for (let j = i - 1; j >= 0; j--) {
                            if (cardEvents[j].message === 'card-entry') {
                                prevEntry = cardEvents[j];
                                break;
                            }
                        }
                        if (prevEntry) {
                            const entryStation = prevEntry.data && prevEntry.data.nStation || '';
                            const exitStation = ev.data && ev.data.nStation || '';
                            let prevExitFareZero = true;
                            for (let j = i - 1; j >= 0; j--) {
                                if (cardEvents[j].message === 'card-exit') {
                                    const pf = parseFloat(cardEvents[j].data && (cardEvents[j].data.fare !== undefined ? cardEvents[j].data.fare : 0)) || 0;
                                    prevExitFareZero = (pf === 0);
                                    break;
                                }
                            }
                            if (entryStation && exitStation && entryStation !== exitStation && prevExitFareZero) {
                                const p = paymentsChron.find(x => x.globalIdx === ev.originalIndex && x.type === 'exit');
                                if (p) p.type = 'hold';
                            }
                        }
                    }
                }
            }

            // payments newest-first (sort by tsDate)
            const payments = paymentsChron
                .map(p => ({
                    type: p.type,
                    date: p.date,
                    time: p.time,
                    station: p.station,
                    amount: p.amount === '' ? '' : Number(p.amount),
                    fare: p.fare === '' ? '' : Number(p.fare),
                    balance: p.balance === '' ? '' : Number(p.balance),
                    _ts: p.tsDate
                }))
                .sort((a, b) => {
                    const da = a._ts ? a._ts.getTime() : 0;
                    const db = b._ts ? b._ts.getTime() : 0;
                    return db - da;
                })
                .map(({_ts, ...rest}) => rest);

            // ---------------- TRANSIT ----------------
            const unpairedEntries = []; // {evt, used:false}
            const transitPairs = [];

            for (let i = 0; i < cardEvents.length; i++) {
                const evt = cardEvents[i];
                const m = evt.message;
                const d = evt.data || {};

                if (m === 'card-entry') {
                    unpairedEntries.push({evt, used: false});
                } else if (m === 'card-exit') {
                    // pair to closest prior unpaired entry where entry.tsDate < exit.tsDate
                    let matchIdx = -1;
                    for (let k = unpairedEntries.length - 1; k >= 0; k--) {
                        const cand = unpairedEntries[k];
                        if (!cand.used && cand.evt.tsDate && cand.evt.tsDate < evt.tsDate) {
                            matchIdx = k;
                            break;
                        }
                    }

                    if (matchIdx >= 0) {
                        const entryObj = unpairedEntries[matchIdx];
                        entryObj.used = true;
                        const ent = entryObj.evt;
                        const ex = evt;
                        const entDate = ent.tsDate;
                        const exDate = ex.tsDate;

                        transitPairs.push({
                            type: 'metro',
                            date: fmtDateLocalFromDate(entDate || exDate),
                            dateExit: fmtDateLocalFromDate(exDate || entDate),
                            nTime: fmtTimeLocalFromDate(entDate, true),
                            nStation: ent.data && ent.data.nStation || '',
                            xTime: fmtTimeLocalFromDate(exDate, true),
                            xStation: ex.data && ex.data.xStation || '',
                            fare: (ex.data && ex.data.fare !== undefined) ? Number(parseFloat(ex.data.fare).toFixed(2)) : 0.00,
                            osi: normalizeOsi(ex.data && ex.data.osi),
                            balance: (ex.data && ex.data.value !== undefined) ? Number(parseFloat(ex.data.value).toFixed(2)) : ((ent.data && ent.data.value !== undefined) ? Number(parseFloat(ent.data.value).toFixed(2)) : ''),
                            entryDateObj: entDate,
                            exitDateObj: exDate
                        });
                    } else {
                        // exit without prior entry (shouldn't happen, but handle gracefully) -> metro exit-only
                        const exDate = evt.tsDate;
                        transitPairs.push({
                            type: 'metro',
                            date: fmtDateLocalFromDate(exDate),
                            dateExit: fmtDateLocalFromDate(exDate),
                            nTime: '',
                            nStation: '',
                            xTime: fmtTimeLocalFromDate(exDate, true),
                            xStation: d.xStation || '',
                            fare: (d.fare !== undefined) ? Number(parseFloat(d.fare).toFixed(2)) : 0.00,
                            osi: normalizeOsi(d && d.osi),
                            balance: d.value !== undefined ? Number(parseFloat(d.value).toFixed(2)) : '',
                            entryDateObj: null,
                            exitDateObj: exDate
                        });
                    }
                } else if (String(m).toLowerCase().includes('payment')) {
                    // explicit payment event -> bus record
                    const evDate = evt.tsDate;
                    transitPairs.push({
                        type: 'bus',
                        date: fmtDateLocalFromDate(evDate),
                        dateExit: fmtDateLocalFromDate(evDate),
                        nTime: fmtTimeLocalFromDate(evDate, true),
                        nStation: d.nStation || d.station || d.from || '',
                        xTime: '',
                        xStation: '',
                        fare: (d.fare !== undefined) ? Number(parseFloat(d.fare).toFixed(2)) : (d.value !== undefined ? Number(parseFloat(d.value).toFixed(2)) : ''),
                        osi: normalizeOsi(d && d.osi),
                        balance: d.value !== undefined ? Number(parseFloat(d.value).toFixed(2)) : '',
                        entryDateObj: evDate,
                        exitDateObj: null
                    });
                }
            }

            // remaining unpaired entries -> metro entry-only
            for (const ue of unpairedEntries) {
                if (!ue.used) {
                    const ent = ue.evt;
                    const entDate = ent.tsDate;
                    transitPairs.push({
                        type: 'metro',
                        date: fmtDateLocalFromDate(entDate),
                        dateExit: fmtDateLocalFromDate(entDate),
                        nTime: fmtTimeLocalFromDate(entDate, true),
                        nStation: ent.data && ent.data.nStation || '',
                        xTime: '',
                        xStation: '',
                        fare: '',
                        osi: normalizeOsi(ent.data && ent.data.osi),
                        balance: ent.data && ent.data.value !== undefined ? Number(parseFloat(ent.data.value).toFixed(2)) : '',
                        entryDateObj: entDate,
                        exitDateObj: null
                    });
                }
            }

            // ---- SORT: newest-first by ENTRY time if entry exists, else by EXIT time ----
            transitPairs.sort((A, B) => {
                const aKey = A.entryDateObj ? A.entryDateObj.getTime() : (A.exitDateObj ? A.exitDateObj.getTime() : 0);
                const bKey = B.entryDateObj ? B.entryDateObj.getTime() : (B.exitDateObj ? B.exitDateObj.getTime() : 0);
                return bKey - aKey;
            });

            // prepare final transit output (clean fields)
            const transitOut = transitPairs.map(p => ({
                type: p.type,
                date: p.date,
                dateExit: p.dateExit,
                nTime: p.nTime,
                nStation: p.nStation,
                xTime: p.xTime,
                xStation: p.xStation,
                fare: (p.fare === '' || p.fare === undefined) ? '' : Number(p.fare),
                osi: (typeof p.osi === 'undefined' || p.osi === null) ? '' : String(p.osi),
                balance: (p.balance === '' || p.balance === undefined) ? '' : Number(p.balance)
            }));

            // expose to window
            window.iciwiPayments = payments;
            window.iciwiTransit = transitOut;

            // console output only
            console.log('iciwi-parser-fixed-v2: serial =', serial);
            console.log('PAYMENT HISTORY (newest-first):', window.iciwiPayments);
            console.log('TRANSIT HISTORY (newest-first by ENTRY time if entry exists else EXIT time):', window.iciwiTransit);

            // for (let i = 0; i < window.iciwiPayments.length; i++) {
            //     const p = window.iciwiPayments[i];
            //     console.log(
            //         "Index:", i,
            //         "Type:", p.type,
            //         "Date:", p.date,
            //         "Time:", p.time,
            //         "Station:", p.station,
            //         "Amount:", p.amount,
            //         "Fare:", p.fare,
            //         "Balance:", p.balance
            //     );
            // }
            //
            // for (let i = 0; i < window.iciwiTransit.length; i++) {
            //     const t = window.iciwiTransit[i];
            //     console.log(
            //         "Index:", i,
            //         "Type:", t.type,
            //         "Date:", t.date,
            //         "DateExit:", t.dateExit,
            //         "Entry:", t.nTime, t.nStation,
            //         "Exit:", t.xTime, t.xStation,
            //         "Fare:", t.fare,
            //         "Balance:", t.balance,
            //         "OSI:", t.osi
            //     );
            // }

            let true_balance = window.iciwiTransit[0];
            let card_balance = document.getElementById("card_balance");
            card_balance.innerHTML = "£ " + true_balance.balance;

            let card_number = document.getElementById("card_number");
            card_number.innerHTML = "• " + actual_serial.substring(3);

            // <div className="payment_details">
            //     <span className="material-symbols-outlined">tram</span>
            //     <div className="payment_text">
            //         <p className="payment_datetime">16 Sep 2025 | 21:31</p>
            //         <p className="payment_title">Fare payment - Downtown</p>
            //     </div>
            //     <p className="payment_total negative">
            //         -£ 3.00
            //     </p>
            // </div>

            let payment_container = document.getElementById("payment_history");
            let last_exit_fare = 0;

            for (let i = 0; i < window.iciwiPayments.length; i++) {
                const p = window.iciwiPayments[i];

                let hr = document.createElement("hr");


                let payment_details = document.createElement("div");
                payment_details.className = "payment_details";

                let type_icon = document.createElement("span");
                type_icon.className = "material-symbols-outlined";

                let payment_text = document.createElement("div");
                payment_text.className = "payment_text";
                let payment_datetime = document.createElement("p");
                payment_datetime.className = "payment_datetime";
                let payment_title = document.createElement("p");
                payment_title.className = "payment_title";

                let payment_total = document.createElement("p");

                let span_icon = "credit_score";
                let span_title = "N/A";

                switch (p.type) {
                    case 'new-card':
                        span_icon = "smart_card_reader";
                        span_title = "Issued new card - KTB/TJT";
                        payment_total.className = "payment_total positive";
                        payment_total.innerHTML = "+£ " + p.amount.toFixed(2);
                        break;
                    case 'top-up-card':
                        span_icon = "add_card";
                        span_title = "Charge - KTB/TJT";
                        payment_total.className = "payment_total positive";
                        payment_total.innerHTML = "+£ " + p.amount.toFixed(2);
                        break;
                    case 'exit':
                        if (p.station.includes("KTB")) {
                            span_icon = "directions_bus";
                            span_title = "Fare payment - KTB/TJT";
                        } else {
                            span_icon = "tram";
                            span_title = "Fare payment - " + p.station;
                        }
                        payment_total.className = "payment_total negative";
                        payment_total.innerHTML = "-£ " + p.fare.toFixed(2);
                        
                        
                        break;
if (p.fare === 0) 
                            last_exit_fare = p.balance;
                    case 'payment':
                        span_icon = "directions_bus";
                        span_title = "Bus payment - KTB/TJT";
                        payment_total.className = "payment_total negative";
                        payment_total.innerHTML = "-£ " + p.fare.toFixed(2);
                        break;
                    case 'refund-card':
                        span_icon = "smart_card_reader_off";
                        span_title = "Card returned - KTB/TJT";
                        payment_total.className = "payment_total negative";
                        payment_total.innerHTML = "-£ " + p.balance.toFixed(2);

                        break;
                    case 'entry':
                        if (p.balance !== last_exit_fare) {
                            console.log((p.balance - last_exit_fare).toFixed(2));
                            span_icon = "hourglass_bottom";
                            span_title = "Debit hold - ICIWI";
                            payment_total.className = "payment_total negative";
                            payment_total.innerHTML = "-£ " + Math.abs(p.balance - last_exit_fare).toFixed(2);
                        } else {
                            continue;
                        }
                        break;
                    default:
                        continue;
                }

                if (i !== 0) {
                    payment_container.appendChild(hr);
                }

                type_icon.innerHTML = span_icon;

                payment_datetime.innerHTML = p.date + " | " + p.time;

                payment_title.innerHTML = span_title;

                payment_text.appendChild(payment_datetime);
                payment_text.appendChild(payment_title);

                payment_details.appendChild(type_icon);
                payment_details.appendChild(payment_text);
                payment_details.appendChild(payment_total);

                payment_container.appendChild(payment_details);
            }



            // <div className="transit_details">
            //     <p className="transit_date">16 Sep 2025</p>
            //     <div className="transit_drawmap">
            //         <p className="transit_time">21:59:00</p>
            //         <div className="transit_dot"></div>
            //         <span className="material-symbols-outlined">directions_subway</span>
            //         <p className="transit_station">Downtown</p>
            //     </div>
            //     <div className="transit_line"></div>
            //     <div className="transit_drawmap drawmap_dest">
            //         <p className="transit_time">22:00:00</p>
            //         <div className="transit_dot"></div>
            //         <span className="material-symbols-outlined">directions_subway</span>
            //         <p className="transit_station">Legacy Road</p>
            //     </div>
            //     <div className="transit_pass">Student Concession Pass used</div> SKIP
            //     <div className="transit_fare_detail">
            //         <div className="transit_fare">£ 3.00</div>
            //         <div className="transit_osi">OSI discounted</div>
            //     </div>
            // </div>

            let transit_history = document.getElementById("transit_history");
            last_exit_fare = 0;

            for (let i = 0; i < window.iciwiTransit.length; i++) {

                const t = window.iciwiTransit[i];

                let transit_details = document.createElement("div");
                transit_details.className = "transit_detail";

                let transit_date = document.createElement("p");
                transit_date.className = "transit_date";
                transit_date.innerHTML = t.date;

                let transit_dot = document.createElement("div");
                transit_dot.className = "transit_dot";

                let my_icon = document.createElement("span");
                my_icon.className = "material-symbols-outlined";
                if (t.type === "bus" || t.nStation.includes("KTB")) {
                    my_icon.innerHTML = "directions_bus";
                } else {
                    my_icon.innerHTML = "directions_subway";
                }

                let transit_time_entry = document.createElement("p");
                transit_time_entry.className = "transit_time";
                transit_time_entry.innerHTML = t.nTime;

                let transit_time_exit = document.createElement("p");
                transit_time_exit.className = "transit_time";
                transit_time_exit.innerHTML = t.xTime;

                let transit_station_entry = document.createElement("p");
                let transit_station_exit = document.createElement("p");
                transit_station_entry.className = "transit_station";
                transit_station_exit.className = "transit_station";
                if (t.type === "bus" || t.nStation.includes("KTB")) {
                    transit_station_entry.innerHTML = "KTB Bus Stop";
                } else {
                    transit_station_entry.innerHTML = t.nStation;
                }
                transit_station_exit.innerHTML = t.xStation;

                let transit_drawmap = document.createElement("div");
                transit_drawmap.className = "transit_drawmap";

                let transit_line = document.createElement("div");
                transit_line.className = "transit_line";

                let transit_drawmap_dest = document.createElement("div");
                transit_drawmap_dest.className = "transit_drawmap drawmap_dest";

                let transit_fare_detail = document.createElement("div");
                transit_fare_detail.className = "transit_fare_detail";

                let transit_fare = document.createElement("div");
                transit_fare.className = "transit_fare";
                let fareCalc = t.fare;
                if (i !== 0 && t.fare === 0 && t.fare !== null && t.fare !== "") fareCalc = Math.abs(t.balance-last_exit_fare).toFixed(2);
                else if (t.fare !== null && t.fare !== "") fareCalc = t.fare.toFixed(2);

                
                transit_fare.innerHTML = "£ "+fareCalc;

                let transit_osi = document.createElement("div");
                transit_osi.className = "transit_osi";

                if (t.osi === true || t.osi === "true") {
                    transit_osi.innerHTML = "OSI applied & discounted";
                }

                last_exit_fare = t.balance;

                let hr = document.createElement("hr");

                if (i !== 0) transit_details.appendChild(hr);

                let my_new_dot = document.createElement("div");
                my_new_dot.className = "transit_dot";

                let my_new_icon = document.createElement("span");
                my_new_icon.innerHTML = "directions_subway";
                my_new_icon.className = "material-symbols-outlined";

                transit_drawmap.appendChild(transit_time_entry);
                if (t.type === "bus" || t.nStation.includes("KTB")) {
                    transit_drawmap.appendChild(my_icon);
                    console.log(i+"bus");
                } else {
                    console.log(i+"bug");
                    transit_drawmap.appendChild(my_new_dot);
                    transit_drawmap.appendChild(my_new_icon);
                }

                transit_drawmap.appendChild(transit_station_entry);

                if (t.type === "bus" || t.nStation.includes("KTB")) {
                    console.log("bus");
                } else {
                    transit_drawmap_dest.appendChild(transit_time_exit);
                    transit_drawmap_dest.appendChild(transit_dot);
                    transit_drawmap_dest.appendChild(my_icon);
                    transit_drawmap_dest.appendChild(transit_station_exit);
                }

                transit_details.appendChild(transit_date);
                transit_details.appendChild(transit_drawmap);
                if (t.type === "bus" || t.nStation.includes("KTB")) {
                    console.log("bus");
                } else {
                    transit_details.appendChild(transit_line);
                    transit_details.appendChild(transit_drawmap_dest);
                }

                transit_fare_detail.appendChild(transit_fare);
                if (t.osi === true || t.osi === "true") {
                    transit_fare_detail.appendChild(transit_osi);
                }
                transit_details.appendChild(transit_fare_detail);

                transit_history.appendChild(transit_details);
            }

        } catch (err) {
            console.error('iciwi-parser-fixed-v2 failure:', err);
        }
    }

    // auto-run
    loadICIWILog();

})();
