import * as browser from "webextension-polyfill";
import { Datacenter, Entry, MessageTypes, PageData } from "../types";

import { LngLatBounds, Map, Marker, setWorkerUrl } from 'maplibre-gl';

let currentTabId: number;
let currentEntries: { [key: string]: Entry } = {};

let map: maplibregl.Map;

let markers: { [key: number]: Marker } = {};
let facility_ids: number[] = [];
let network_ids: number[] = [];
let network_datacenters: { [key: number]: number[] };

let pageUrl: string;

let bounds: LngLatBounds;

browser.runtime.onMessage.addListener(async (message: any, _sender: browser.Runtime.MessageSender) => {
    if (message.tabId != currentTabId)
        return;

    if (message.type == MessageTypes.NEW_ENTRY) {
        const entry: Entry = message.data;
        currentEntries[entry.ip] = entry;
        addEntry(entry);
    }
    else if (message.type == MessageTypes.UPDATE_ENTRY) {
        const entry: Entry = message.data;
        currentEntries[entry.ip] = entry;
        updateEntry(entry);
    }
    else if (message.type == MessageTypes.COUNTS) {
        const { cachedCount, requestsCount } = message.data;
        updateCounts(cachedCount, requestsCount);
    }
    else if (message.type == MessageTypes.UPDATE_FACILITIES) {
        network_ids = Object.keys(message.data.networks).map(k => parseInt(k));
        updateFacilities(message.data.facilities);
        network_datacenters = {};
        for (const net_id of Object.keys(message.data.networkDatacenters)) {
            network_datacenters[parseInt(net_id)] = Array.from(message.data.networkDatacenters[parseInt(net_id)]);
        }
    }
});

async function load() {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    currentTabId = tab.id ? tab.id : 0;

    setWorkerUrl(browser.runtime.getURL('maplibre-gl-csp-worker.js'));
    map = new Map({
        container: 'map',
        style: 'https://tiles.openfreemap.org/styles/liberty',
        interactive: false
    });

    map.on('load', () => {
        if (bounds?._ne)
            map.fitBounds(bounds, { padding: 40, animate: false, maxZoom: 14 });

    });

    browser.runtime.sendMessage({ type: MessageTypes.GET_TAB_DATA, tabId: tab.id }).then((response: any) => {
        if (!response)
            return;

        const pageData: PageData = response;
        const { cachedCount, requestsCount, networks, networksDatacenters } = pageData;
        currentEntries = pageData.entries;
        pageUrl = pageData.pageUrl;

        for (const ip of Object.keys(currentEntries))
            addEntry(currentEntries[ip]);

        updateCounts(cachedCount, requestsCount);
        updateUrl(pageData.pageUrl);
        updateFacilities(pageData.facilities);

        network_ids = Object.keys(networks).map(k => parseInt(k));
        network_datacenters = {};
        for (const net_id of Object.keys(networksDatacenters)) {
            network_datacenters[parseInt(net_id)] = Array.from(networksDatacenters[parseInt(net_id)]);
        }
    });

    document.getElementById('details-btn')?.addEventListener('click', () => {
        const data = {
            facility_ids,
            network_ids,
            network_datacenters,
            entries: currentEntries,
            pageUrl,
        };
        console.log(JSON.stringify(data, null, 2));
        const data64 = btoa(JSON.stringify(data));
        browser.tabs.create({ url: `http://localhost:5173/?data=${data64}` });
    });

}

function isIPv6(ip: string) {
    return ip.includes(':');
}

// ----------------- UI Update functions -----------------
let entryElements: { [key: string]: HTMLDivElement } = {};

function updateUrl(url: string) {
    const pageUrl = document.getElementById("page-url");
    if (pageUrl)
        pageUrl.innerHTML = url;
}

function addEntry(entry: Entry) {
    const entriesList = document.getElementById('entries-list');
    const emptyState = document.getElementById('empty-state');

    if (!entriesList)
        return;

    if (emptyState)
        emptyState.style.display = 'none';

    const row = document.createElement('div');
    row.className = 'entry';

    const ipv6 = isIPv6(entry.ip);
    const ip_el = document.createElement('span');
    ip_el.classList.add("entry-ip");
    if (ipv6)
        ip_el.classList.add("ipv6");
    ip_el.innerText = entry.ip;

    const host_el = document.createElement('span');
    host_el.classList.add('entry-host');
    host_el.innerText = entry.hostname;

    const network_name = '??';

    const network_btn = document.createElement('button');
    network_btn.classList.add("entry-type");
    network_btn.innerText = network_name;

    const count_el = document.createElement('span');
    count_el.classList.add('entry-count');
    count_el.innerText = entry.count.toString();

    const time_el = document.createElement('span');
    time_el.classList.add('entry-time');
    time_el.innerText = entry.durationMs ? `${Math.round(entry.durationMs)}ms` : "-";

    row.appendChild(ip_el);
    row.appendChild(host_el);
    row.appendChild(network_btn);
    row.appendChild(count_el);
    row.appendChild(time_el);

    entriesList.appendChild(row);

    entryElements[entry.ip] = row;
}

function updateEntry(entry: Entry) {
    const row = entryElements[entry.ip];
    if (!row) {
        addEntry(entry);
        return;
    }

    const count_el = row.querySelector(".entry-count");
    if (count_el)
        count_el.innerHTML = entry.count.toString();

    const time_el = row.querySelector(".entry-time");
    if (time_el)
        time_el.innerHTML = entry.durationMs ? `${Math.round(entry.durationMs)}ms` : "-";

}

function updateCounts(cachedCount: number, requestsCount: number) {
    const requestsCounter = document.getElementById("req-count");
    const cachedCounter = document.getElementById("cached-count");
    const ipCounter = document.getElementById("ip-count");

    if (requestsCounter)
        requestsCounter.innerHTML = requestsCount.toString();

    if (cachedCounter)
        cachedCounter.innerHTML = cachedCount.toString();

    if (ipCounter)
        ipCounter.innerHTML = Object.keys(entryElements).length.toString();
}

function updateFacilities(datacenters: { [key: number]: Datacenter }) {
    const facilityCounter = document.getElementById("facility-count");
    const numFacilities = Array.from(Object.keys(datacenters)).length.toString();
    if (facilityCounter)
        facilityCounter.innerHTML = numFacilities;

    if (!map)
        return;

    if (numFacilities) {
        const detailsBtn = document.getElementById('details-btn') as HTMLButtonElement;
        if (detailsBtn)
            detailsBtn.disabled = false;
    }

    for (const fac_id of Object.keys(datacenters)) {
        const id = parseInt(fac_id);
        if (!markers[id]) {
            const facility = datacenters[id];
            const marker = new Marker()
                .setLngLat([facility.lon, facility.lat])
                .addTo(map);
            markers[id] = marker;
            facility_ids.push(id);
        }
    }

    bounds = Object.values(markers).reduce((bounds, marker) => {
        return bounds.extend(marker.getLngLat());
    }, new LngLatBounds());

    if (bounds._ne)
        map.fitBounds(bounds, { padding: 40, maxZoom: 14 });

}

load();
