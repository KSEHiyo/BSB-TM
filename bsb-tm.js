// ==UserScript==
// @name         BSB-TM
// @version      0.1
// @description  简单的油猴脚本,利用https://github.com/hanydd/BilibiliSponsorBlock的API跳过B站视频中的广告
// @author       KSEHiyo
// @license      GPLv3
// @match        *://*.bilibili.com/video/*
// @grant        GM_xmlhttpRequest
// @connect      bsbsb.top
// @connect      115.190.32.254
// ==/UserScript==

var oldHref = document.location.href;
window.onload = function() {
    var bodyList = document.querySelector('body');

    var observer = new MutationObserver(function(mutations) {
        if (oldHref != document.location.href) {
            oldHref = document.location.href;
            initSponsorBlock();
        }
    });

    var config = {
        childList: true,
        subtree: true
    };

    observer.observe(bodyList, config);
};

function initSponsorBlock() {
    'use strict';
    console.log("Initializing sponsor block for:", location.href);

    // get video player
    let player = getPlayer();
    if (!player) return;

    // get video id
    let videoId = getVideoId();
    if (!videoId) return;

    // get sponsor timestamps
    getSponsorTimestamps(videoId).then(sponsorTimestamps => {
        if (!sponsorTimestamps) {
            console.log('getSponsorTimestamps FAILED');
            return;
        }

        console.log(sponsorTimestamps);

        // Remove previously registered event if any
        player.removeEventListener('timeupdate', skipSegment);
        // Attach event listener
        player.addEventListener('timeupdate', skipSegment.bind(null, sponsorTimestamps));
    });
}

function skipSegment(sponsorTimestamps, event) {
    let player = event.target;
    if (player.currentTime >= sponsorTimestamps[0] && player.currentTime < sponsorTimestamps[1]) {
        player.currentTime = sponsorTimestamps[1];
        console.log(`跳过 ${sponsorTimestamps[0]} - ${sponsorTimestamps[1]} 的片段`);
    }
}



// get video player
function getPlayer() {
    let player = document.querySelector('video');
    if (!player) {
        console.log('video player not found');
    }
    return player;
}

// get video id
function getVideoId() {
    let videoId = window.location.href.match(/BV\w+/);
    if (!videoId) {
        console.log('video id not found');
    }

    return videoId;
}

async function getSponsorTimestamps(videoId) {
    return new Promise((resolve, reject) => {
        const url = `https://bsbsb.top/api/skipSegments?videoID=${videoId}&category=sponsor`;
        console.log(url);

        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            headers: {
                "origin": "chrome-extension://eaoelafamejbnggahofapllmfhlhajdd",
                "x-ext-version": "0.5.0"
            },
            onload: function(response) {
                if (response.status >= 200 && response.status < 300) {
                    let data = JSON.parse(response.responseText);
                    resolve(data[0].segment);
                } else {
                    console.log('sponsor block api error');
                    resolve(null);
                }
            },
            onerror: function(error) {
                console.log('sponsor block api error', error);
                resolve(null);
            }
        });
    });
}
