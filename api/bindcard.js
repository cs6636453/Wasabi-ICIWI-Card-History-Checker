document.addEventListener("DOMContentLoaded", function() {
    const input = document.getElementById("serial_number");
    const button = document.getElementById("bind_button");

    // --- Helper: read a cookie by name ---
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return decodeURIComponent(parts.pop().split(';')[0]);
        return null;
    }

    // --- Helper: set a persistent cookie (~10 years) ---
    function setCookie(name, value) {
        const d = new Date();
        d.setTime(d.getTime() + (10 * 365 * 24 * 60 * 60 * 1000)); // 10 years
        const expires = "expires=" + d.toUTCString();
        document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
    }

    // --- Redirect if card already bound ---
    const existingCard = getCookie("iciwi_serial");
    if (existingCard) {
        window.location.href = "result/v2/?card=" + encodeURIComponent(existingCard);
        return;
    }

    // --- Focus input on page load ---
    input.focus();
    const length = input.value.length;
    input.setSelectionRange(length, length);

    // --- Validate and bind card ---
    function validateAndBind() {
        let card_serial = input.value.trim().toUpperCase(); // normalize to uppercase
        const serial_pattern = /^B[A-Z]-[0-9]{1,5}$/;

        if (serial_pattern.test(card_serial)) {
            setCookie("iciwi_serial", card_serial); // store cookie
            window.location.href = "result/v2/?card=" + encodeURIComponent(card_serial);
        } else {
            // show an error message if you have a notice element
            const notice = document.getElementById("invalid_card_notice");
            if (notice) notice.innerHTML = "Sorry, it seems that your card is invalid.";
            input.focus();
            const length = input.value.length;
            input.setSelectionRange(length, length);
        }
    }

    // --- Button click ---
    button.addEventListener("click", validateAndBind);

    // --- Press Enter inside input ---
    input.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            validateAndBind();
        }
    });
});
