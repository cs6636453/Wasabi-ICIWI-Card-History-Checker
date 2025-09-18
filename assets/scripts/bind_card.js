// Helper function to set a cookie
function setCookie(name, value, days = 36500) { // ~100 years
    const expires = new Date();
    expires.setTime(expires.getTime() + (days*24*60*60*1000));
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
}

// On DOM load
document.addEventListener("DOMContentLoaded", () => {
    const cardInput = document.getElementById("card_no");
    const bindButton = document.getElementById("bind_button");
    const hintError = document.getElementById("hint_error");

    bindButton.addEventListener("click", () => {
        let cardValue = cardInput.value.trim().toUpperCase();

        // Ensure it starts with "B"
        cardValue = "B" + cardValue;
        

        // Validate pattern: Bx-xxxxx (B + hyphen + 1-5 digits)
        const pattern = /^B[A-Z]-[0-9]{1,5}$/;
        if (!pattern.test(cardValue)) {
            hintError.textContent = "Sorry, it looks like your card is invalid. Please try again.";
            return;
        }

        // Store in cookie
        setCookie("iciwi_serial", cardValue);

        // Redirect
        window.location.href = "../";
    });
});
