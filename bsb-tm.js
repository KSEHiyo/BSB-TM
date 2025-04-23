// ==UserScript==
// @name         BSB-TM
// @version      0.1
// @description  简单的油猴脚本,利用https://github.com/hanydd/BilibiliSponsorBlock的API跳过B站视频中的广告
// @author       KSEHiyo
// @license      GPLv3
// @match        *://*.bilibili.com/video/*
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
            console.log('sponsor block api error');
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

// get sponsor timpstamps
async function getSponsorTimestamps(videoId) {
    const url = `https://bsbsb.top/api/skipSegments?videoID=${videoId}&category=sponsor`;
    console.log(url);
    const headers = {
        "origin": "chrome-extension://eaoelafamejbnggahofapllmfhlhajdd",
        "x-ext-version": "0.5.0"
    };


    try {
        let response = await fetch(url, {
            method: "GET",
            headers: headers
        });
        if (response.ok) {
            let data = await response.json();
            return data[0].segment;
        } else {
            console.log('sponsor block api error');
            return null;
        }
    } catch (error) {
        console.log('sponsor block api error', error);
        return null;
    }
}
