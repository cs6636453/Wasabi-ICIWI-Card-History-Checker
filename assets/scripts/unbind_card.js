// Function to delete a cookie
function deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
}

// Show confirm popup
function showConfirm() {
    document.getElementById('confirmOverlay').style.display = 'flex';
}

// Cancel unbind
function cancelUnbind() {
    document.getElementById('confirmOverlay').style.display = 'none';
}

// Confirm unbind
function confirmUnbind() {
    deleteCookie('iciwi_serial');
    document.getElementById('confirmOverlay').style.display = 'none';
    // Redirect to binding page
    window.location.href = 'bind_card'; // change this
}

window.addEventListener('load', () => {
    // Attach event listeners to your existing buttons
    const unbindButtons = ['unbind_card', 'unbind_card_pc'];
    unbindButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', showConfirm);
        }
    });
});