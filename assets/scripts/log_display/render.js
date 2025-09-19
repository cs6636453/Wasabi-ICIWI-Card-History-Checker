function payment_render(raw_text) {

    // <div className="payment_details"> (id = payment_history)
    //     <span className="material-symbols-outlined">tram</span>
    //     <div className="payment_text">
    //         <p className="payment_datetime">16 Sep 2025 | 21:31</p>
    //         <p className="payment_title">Fare payment - Downtown</p>
    //     </div>
    //     <p className="payment_total negative">
    //         -£ 3.00
    //     </p>
    // </div>

    // 0 icon, 1 date, 2 time, 3 title1, 4 title2, 5 fare
    let payment_history = document.getElementById("payment_history");
    for (let i = 0; i < raw_text.length; i++) {
        let hr = document.createElement("hr");
        if (i !== 0) payment_history.appendChild(hr);
        let payment_details = document.createElement("div");
        payment_details.classList.add("payment_details");
        let span_icon = document.createElement("span");
        span_icon.classList.add("material-symbols-outlined");
        span_icon.innerHTML = raw_text[i][0];
        let payment_text = document.createElement("div");
        payment_text.classList.add("payment_text");
        let payment_datetime = document.createElement("p");
        payment_datetime.classList.add("payment_datetime");
        payment_datetime.innerHTML = raw_text[i][1] + " | " + raw_text[i][2];
        let payment_title = document.createElement("p");
        payment_title.classList.add("payment_title");
        payment_title.innerHTML = raw_text[i][3] + " - " + raw_text[i][4];
        let payment_total = document.createElement("p");
        payment_total.classList.add("payment_total");
        if (raw_text[i][5] > 0) payment_total.classList.add("positive");
        else payment_total.classList.add("negative");
        let payment_sign;
        raw_text[i][5] > 0 ? payment_sign = "+£ " : payment_sign = "-£ ";
        payment_total.innerHTML = payment_sign + (Math.abs(raw_text[i][5])).toFixed(2);
        payment_text.appendChild(payment_datetime);
        payment_text.appendChild(payment_title);
        payment_details.appendChild(span_icon);
        payment_details.appendChild(payment_text);
        payment_details.appendChild(payment_total);
        payment_history.appendChild(payment_details);
    }
}

function transit_render(raw_text) {
    let transit_history = document.getElementById("transit_history");
    for (let i = 0; i < raw_text.length; i++) {
        let hr = document.createElement("hr");
        if (i !== 0) transit_history.appendChild(hr);
        let transit_details = document.createElement("div");
        transit_details.classList.add("transit_details");
        let transit_date = document.createElement("p");
        transit_date.classList.add("transit_date");
        let transit_drawmap = document.createElement("div");
        transit_drawmap.classList.add("transit_drawmap");
        let transit_time = document.createElement("p");
        transit_time.classList.add("transit_time");
        let transit_dot = document.createElement("div");
        transit_dot.classList.add("transit_dot");
        let span_icon = document.createElement("span");
        span_icon.classList.add("material-symbols-outlined");
        let transit_station = document.createElement("p");
        transit_station.classList.add("transit_station");
        let transit_line = document.createElement("div");
        transit_line.classList.add("transit_line");
        let transit_drawmap2 = document.createElement("div");
        transit_drawmap2.classList.add("transit_drawmap");
        let transit_time2 = document.createElement("p");
        transit_time2.classList.add("transit_time");
        let transit_dot2 = document.createElement("div");
        transit_dot2.classList.add("transit_dot");
        let span_icon2 = document.createElement("span");
        span_icon2.classList.add("material-symbols-outlined");
        let transit_station2 = document.createElement("p");
        transit_station2.classList.add("transit_station");
        let transit_invalid = document.createElement("div");
        transit_invalid.classList.add("transit_invalid");
        let transit_pass = document.createElement("div");
        transit_pass.classList.add("transit_pass");
        let transit_fare_detail = document.createElement("div");
        transit_fare_detail.classList.add("transit_fare_detail");
        let transit_fare = document.createElement("div");
        transit_fare.classList.add("transit_fare");
        let transit_osi = document.createElement("div");
        transit_osi.classList.add("transit_osi");

        // <div className="transit_details"> (id = transit_history)
        //     <p className="transit_date">16 Sep 2025</p>
        //     <div className="transit_drawmap">
        //         <p className="transit_time">21:59:00</p>
        //         <div className="transit_dot"></div>
        //         <span className="material-symbols-outlined">directions_subway</span>
        //         <p className="transit_station">Downtown</p>
        //     </div>
        //     <div className="transit_line"></div>
        // <!-- shared -->
        //     <div className="transit_drawmap drawmap_dest">
        //         <p className="transit_time">22:00:00</p>
        //         <div className="transit_dot"></div>
        //         <span className="material-symbols-outlined">directions_subway</span>
        //         <p className="transit_station">Legacy Road</p>
        //     </div>
        //     <div className="transit_invalid">Entry invalid</div>
        //     <div className="transit_pass">KTB_S_PASS</div>
        //     <div className="transit_fare_detail">
        //         <div className="transit_fare">£ 3.00</div>
        //         <div className="transit_osi">OSI discounted</div>
        //     </div>
        // </div>

        // 0 date, 1 icon, 2 nTime, 3 nStation, 4 isInvalid, 5 pass, 6 fare, 7 osi, 8 xTime, 9 xStation

        transit_invalid.innerHTML = "Invalid journey";

        transit_date.innerHTML = raw_text[i][0];
        transit_details.appendChild(transit_date);
        raw_text[i][2] ? transit_time.innerHTML = raw_text[i][2] : transit_time.innerHTML = "N/A";
        span_icon.innerHTML = raw_text[i][1];
        transit_station.innerHTML = raw_text[i][3];
        console.log(transit_station);
        transit_drawmap.appendChild(transit_time);
        transit_drawmap.appendChild(transit_dot);
        transit_drawmap.appendChild(span_icon);
        transit_drawmap.appendChild(transit_station);
        transit_details.appendChild(transit_drawmap);
        transit_details.appendChild(transit_line);
        raw_text[i][8] ? transit_time2.innerHTML = raw_text[i][8] : transit_time2.innerHTML = "N/A";
        transit_station2.innerHTML = raw_text[i][9];
        transit_drawmap2.appendChild(transit_time2);
        transit_drawmap2.appendChild(transit_dot2);
        span_icon2.innerHTML = raw_text[i][1];
        transit_drawmap2.appendChild(span_icon2);
        transit_drawmap2.appendChild(transit_station2);
        transit_details.appendChild(transit_drawmap2);
        transit_details.classList.add("drawmap_dest");
        transit_pass.innerHTML = raw_text[i][5];
        transit_fare.innerHTML = "£ "+(Math.abs(raw_text[i][6])).toFixed(2);
        transit_osi.innerHTML = "OSI discounted";
        raw_text[i][4] ? transit_details.appendChild(transit_invalid) : console.log("Journey normal");
        raw_text[i][5] ? transit_details.appendChild(transit_pass) : console.log("No pass detected");
        raw_text[i][6] !== 0 ? transit_fare_detail.appendChild(transit_fare) : console.log("Fare is equal to 0");
        raw_text[i][7] ? transit_fare_detail.appendChild(transit_osi) : console.log("No OSI detected");
        transit_details.appendChild(transit_fare_detail);
        transit_history.appendChild(transit_details);
    }
}

function card_render(type, balance, exp, serial, name) {
    // <p id="balance_text"></p>
    // <p id="card_balance"></p>
    // <p id="expiry_date"></p>
    // <p id="card_number"></p>
    // <p id="card_name"></p>

    let balance_text = document.getElementById("balance_text");
    let card_balance = document.getElementById("card_balance");
    let expiry_date = document.getElementById("expiry_date");
    let card_number = document.getElementById("card_number");
    let card_name = document.getElementById("card_name");

    let sliced = serial.slice(3);          // remove first 3 characters
    let padded = sliced.padStart(5, '0');  // ensure at least 5 characters, pad with 0
    card_number.innerHTML = "• " + padded;
    expiry_date.innerHTML = exp;

    if (type === "refund-card") {
        balance_text.innerHTML = "VOID";
        card_number.innerHTML = "";
        card_name.innerHTML = "• "+padded;
    } else {
        balance_text.innerHTML = "Balance: ";
        card_balance.innerHTML = "£ "+ balance;
        card_name.innerHTML = name;
    }

}