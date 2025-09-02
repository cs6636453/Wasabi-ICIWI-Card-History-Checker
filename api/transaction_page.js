document.addEventListener("DOMContentLoaded", function() {
    const buttons = document.querySelectorAll("nav.transaction > input");
    const footer = document.querySelector("body > footer"); // footer element
    const unbindBtn = document.getElementById("unbind_button");

    // --- Cookie helpers ---
    function setCookie(name, value, days = 365) {
        const d = new Date();
        d.setTime(d.getTime() + (days*24*60*60*1000));
        document.cookie = name + "=" + encodeURIComponent(value) + ";path=/;expires=" + d.toUTCString();
    }

    function getCookie(name) {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            let [key, val] = cookie.trim().split('=');
            if (key === name) return decodeURIComponent(val);
        }
        return null;
    }

    function deleteCookie(name) {
        document.cookie = name + "=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    }

    // --- Redirect if no card ---
    const cardSerial = getCookie("iciwi_serial");
    if (!cardSerial) {
        window.location.href = "../../";
        return;
    }

    // --- Tab handler ---
    function activateTab(tabId) {
        buttons.forEach(b => b.classList.remove("active"));
        const btn = document.getElementById(tabId);
        if (!btn || btn.disabled) return;
        btn.classList.add("active");

        // Hide all sections
        document.querySelectorAll("#transaction_page, #trip_history_page, #passes_page").forEach(sec => {
            sec.style.display = "none";
        });

        // Show active section
        if (tabId === "payment_history") {
            document.querySelector("#transaction_page").style.display = "block";
            footer.classList.remove("negative_margin");
        } else if (tabId === "trip_history") {
            document.querySelector("#trip_history_page").style.display = "block";
            footer.classList.add("negative_margin");
        } else if (tabId === "passes") {
            document.querySelector("#passes_page").style.display = "block";
            footer.classList.remove("negative_margin");
        }

        setCookie("active_tab", tabId);
    }

    // --- Restore previous tab ---
    const savedTab = getCookie("active_tab");
    if (savedTab) activateTab(savedTab);
    else activateTab("payment_history"); // default

    // --- Click listeners for tabs ---
    buttons.forEach(btn => {
        btn.addEventListener("click", function() {
            activateTab(this.id);
        });
    });

    // --- Loading screen support ---
    const loader = document.getElementById("loading_overlay");
    if (loader) {
        window.addEventListener("load", function() {
            loader.style.display = "none";
        });
    }

    // --- Unbind card ---
    if (unbindBtn) {
        unbindBtn.addEventListener("click", function() {
            const confirmed = window.confirm("Are you sure you want to unbind this card?");
            if (!confirmed) return; // user canceled

            deleteCookie("active_tab");
            deleteCookie("iciwi_serial"); // delete actual card serial
            window.location.href = "../../";
        });
    }


    // --- Optional: expose reset for dev/debug ---
    window.resetActiveTab = function() {
        deleteCookie("active_tab");
        activateTab("payment_history");
    };
});
