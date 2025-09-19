function getCookie(name) {
    let value = "; " + document.cookie;
    let parts = value.split("; " + name + "=");
    if (parts.length === 2) {
    return parts.pop().split(";").shift();
}
    return null; // cookie not found
}

    // Example usage:
    let serial = getCookie("iciwi_serial");
    if (serial) {
    // Do something if cookie exists
} else {
    // Do something else if missing
}

// Show popup
function showPopup() {
    document.getElementById('popupOverlay').style.display = 'flex';
}

function closePopup() {
    document.getElementById('popupOverlay').style.display = 'none';
    // Redirect to another page
    window.location.href = 'bind_card'; // change this
}

// Run check on page load
function checkCard() {
    const serial = getCookie('iciwi_serial');
    if (!serial) {
        showPopup();
    }
}

// Initial check
window.addEventListener('load', checkCard);

// Check also when user navigates back with browser history
window.addEventListener('pageshow', function(event) {
    // event.persisted is true when page is loaded from bfcache (back-forward cache)
    if (event.persisted) {
        checkCard();
    }
});
