// Wait until everything is loaded
window.addEventListener("load", () => {
    const loader = document.getElementById("loader");
    loader.classList.add("hidden");
});

let page = 0;

function page_payment() {
    let payment_history = document.getElementById("payment_history");
    let transit_history = document.getElementById("transit_history");
    let my_account = document.getElementById("my_account");

    let go_payment = document.getElementById("go_payment");
    let go_transit = document.getElementById("go_transit");
    let go_account = document.getElementById("go_account");

    payment_history.style.display = "";
    transit_history.style.display = "none";
    my_account.style.display = "none";

    go_payment.classList.add("active");
    go_transit.classList.remove("active");
    go_account.classList.remove("active");

    page = 1;
}

function page_transit() {
    let payment_history = document.getElementById("payment_history");
    let transit_history = document.getElementById("transit_history");
    let my_account = document.getElementById("my_account");

    let go_payment = document.getElementById("go_payment");
    let go_transit = document.getElementById("go_transit");
    let go_account = document.getElementById("go_account");

    payment_history.style.display = "none";
    transit_history.style.display = "";
    my_account.style.display = "none";

    go_payment.classList.remove("active");
    go_transit.classList.add("active");
    go_account.classList.remove("active");

    page = 0;
}

function page_account() {
    let payment_history = document.getElementById("payment_history");
    let transit_history = document.getElementById("transit_history");
    let my_account = document.getElementById("my_account");

    let go_payment = document.getElementById("go_payment");
    let go_transit = document.getElementById("go_transit");
    let go_account = document.getElementById("go_account");

    payment_history.style.display = "none";
    transit_history.style.display = "none";
    my_account.style.display = "";

    go_payment.classList.remove("active");
    go_transit.classList.remove("active");
    go_account.classList.add("active");

    page = 2;
}

window.onload = function() {
    page_transit();
}

function handleResize() {
    if (window.matchMedia("(min-width: 1024px)").matches) {
        // For PC/Desktop
        if (page === 2) {
            page_payment();
        }
        // 👉 Put your code here (e.g. hide/show pages, load different content)
    }
}

// Run on page load
handleResize();

// Run on window resize
window.addEventListener("resize", handleResize);