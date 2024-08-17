// ==UserScript==
// @name         Deezer: Copy artists
// @namespace    http://tampermonkey.net/
// @version      2024-08-16
// @description  Add a button to copy the artists or featured artist
// @author       spavat
// @match        https://www.deezer.com/fr/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=deezer.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    let observerRunning = false;

    /* HISTORI API changes */
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    function handleStateChange() {
        const newUrl = window.location.href;
        console.log('URL changed to:', newUrl);
        if (newUrl.includes("/album/") || newUrl.includes("/playlist/")) {
            console.log("this page need a check!");
            if (!observerRunning) {
                console.log("connecting observer...");
                observer.observe(document, {childList: true, subtree: true});
                observerRunning = true;
            } else {
                console.log("observer already runnin, just waiting...");
            }
        } else {
            if (observerRunning) {
                console.log("disconnecting observer...");
                observer.disconnect();
                observerRunning = false;
            }
        }
    }

    history.pushState = function() {
        originalPushState.apply(this, arguments);
        handleStateChange();
    };

    history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        handleStateChange();
    };

    async function writeClipboardText(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (error) {
            console.error(error.message);
        }
    }

    const ADDED_BUTTON_CHAR = "🔨";
    const HEADER_TABLE_SELECTOR = ".catalog-content div[role=rowgroup]:nth-child(1)";
    const ARTISTS_CELLS_SELECTOR = ".catalog-content div[role=rowgroup] div[role=row] div[role=gridcell]:nth-child(2)";

    function check(changes, observer) {
        // if no "artists cells", nothing to do
        if(!document.querySelector(ARTISTS_CELLS_SELECTOR)) {
            return;
        }

        // if no artists in the header, nothing to do
        const headerRow = document.querySelector(HEADER_TABLE_SELECTOR);
        if (!headerRow?.textContent?.includes("ARTISTES INVITÉ·ES") && !headerRow?.textContent?.includes("ARTISTE")) {
            console.log("no featured artists/artists, stopping...");
            return;
        }

        const artistCells = document.querySelectorAll(ARTISTS_CELLS_SELECTOR);
        artistCells.forEach((cell) => {
            const content = cell.textContent.replaceAll(/, /g, "; ");
            // empty or already updated cell
            if (content === "-" || content.startsWith(ADDED_BUTTON_CHAR)) {
                return;
            }

            const buttonText = document.createTextNode(ADDED_BUTTON_CHAR);
            const button = document.createElement("button");
            button.appendChild(buttonText);
            button.addEventListener("click", () => {
                console.log("copy:", content);
                writeClipboardText(content);
            });
            cell.prepend(button);
        });
    }
    const observer = new MutationObserver(check);
    observer.observe(document, {childList: true, subtree: true});
    observerRunning = true;

})();
