let map;
let osmLayer;
let satelliteLayer;
let currentPosition = null;
let positionMarker = null;
let watchId = null;
let followMode = true;

let countryLayer = null;
let regionLayer = null;
let cityLayer = null;
let isSatelliteMode = false;

let erdoLayer = null;
let hrszLayer = null;
let tagLayer = null;

const NEBIH_WMS_URL = 'https://erdoterkep.nebih.gov.hu/geoserver/nebih/wms?';

const DEFAULT_LOCATION = [47.5, 19.0];

const BOUNDARY_COLORS = {
    country: '#FF5722',
    region: '#FFEB3B', 
    city: '#00BCD4'
};

function init() {
    console.log('Init started');
    initMap();
    console.log('Map initialized, zoom:', map.getZoom());
    initLayers();
    initControls();
    
    satelliteLayer.addTo(map);
    isSatelliteMode = true;
    
    if (followMode) {
        map.dragging.disable();
    }
    
    loadAllLayers();
    loadAllBoundaries();
    
    startGeolocation();
    loadSavedPosition();
    
    document.querySelector('input[name="baselayer"][value="satellite"]').checked = true;
    
    showToast('Alkalmazás betöltve');
}

function loadAllLayers() {
    if (!erdoLayer) {
        erdoLayer = L.tileLayer.wms(NEBIH_WMS_URL, {
            layers: 'KUL_RESZLET_VW',
            format: 'image/png8',
            transparent: true,
            opacity: 0.7,
            crs: L.CRS.EPSG3857
        });
    }
    erdoLayer.addTo(map);
    
    if (!tagLayer) {
        tagLayer = L.tileLayer.wms(NEBIH_WMS_URL, {
            layers: 'KUL_TAG',
            format: 'image/png8',
            transparent: true,
            opacity: 0.8,
            crs: L.CRS.EPSG3857
        });
    }
    tagLayer.addTo(map);
    
    if (!hrszLayer) {
        hrszLayer = L.tileLayer.wms(NEBIH_WMS_URL, {
            layers: 'kul_hrszek',
            format: 'image/png8',
            transparent: true,
            opacity: 0.5,
            crs: L.CRS.EPSG3857
        });
    }
    hrszLayer.addTo(map);
}

function initMap() {
    map = L.map('map', {
        center: DEFAULT_LOCATION,
        zoom: 8,
        zoomControl: true,
        preferCanvas: true
    });
    
    osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    });
    
    satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '© ESRI'
    });
    
    osmLayer.addTo(map);
    
    map.on('zoomend', onZoomEnd);
    map.on('moveend', onMapMove);
    map.on('drag', onMapDrag);
}

function onMapDrag() {
    if (!followMode && positionMarker) {
        positionMarker.setLatLng(map.getCenter());
        updateDisplayCoordsFromCenter();
    }
}

function updateDisplayCoordsFromCenter() {
    if (!followMode && map) {
        const center = map.getCenter();
        document.getElementById('lat').textContent = center.lat.toFixed(7);
        document.getElementById('lon').textContent = center.lng.toFixed(7);
        document.getElementById('accuracy').textContent = '-- m';
    }
}

function onZoomEnd() {
    loadBoundaries();
}

function onMapMove() {
    loadAllBoundaries();
}

function loadBoundaries() {
    loadAllBoundaries();
}

function loadAllBoundaries() {
    const zoom = map.getZoom();
    
    loadCountryBoundary();
    
    if (zoom >= 6) {
        loadRegionBoundary();
    } else {
        if (regionLayer) { map.removeLayer(regionLayer); regionLayer = null; }
    }
    
    if (zoom >= 9) {
        loadCityBoundary();
    } else {
        if (cityLayer) { map.removeLayer(cityLayer); cityLayer = null; }
    }
}

function removeAllBoundaries() {
    if (countryLayer) { map.removeLayer(countryLayer); countryLayer = null; }
    if (regionLayer) { map.removeLayer(regionLayer); regionLayer = null; }
    if (cityLayer) { map.removeLayer(cityLayer); cityLayer = null; }
}

function getBoundaryStyle(type) {
    const color = BOUNDARY_COLORS[type];
    return {
        color: color,
        weight: type === 'country' ? 5 : (type === 'region' ? 4 : 3),
        opacity: 1,
        fillOpacity: 0.15,
        fillColor: color,
        smoothFactor: 1
    };
}

function initLayers() {
    document.querySelectorAll('input[name="baselayer"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'osm') {
                map.removeLayer(satelliteLayer);
                osmLayer.addTo(map);
                isSatelliteMode = false;
            } else {
                map.removeLayer(osmLayer);
                satelliteLayer.addTo(map);
                isSatelliteMode = true;
            }
        });
    });
}

function initControls() {
    document.getElementById('btn-layers').addEventListener('click', () => {
        togglePanel('layer-panel');
    });
    
    document.getElementById('btn-gnss').addEventListener('click', () => {
        togglePanel('gnss-panel');
    });
    
    document.getElementById('btn-follow').addEventListener('click', () => {
        const btn = document.getElementById('btn-follow');
        followMode = !followMode;
        btn.classList.toggle('active', followMode);
        
        if (followMode) {
            map.dragging.disable();
            if (currentPosition && positionMarker) {
                positionMarker.setLatLng([currentPosition.lat, currentPosition.lon]);
                map.panTo([currentPosition.lat, currentPosition.lon]);
                document.getElementById('lat').textContent = currentPosition.lat.toFixed(7);
                document.getElementById('lon').textContent = currentPosition.lon.toFixed(7);
                document.getElementById('accuracy').textContent = currentPosition.accuracy.toFixed(2) + ' m';
            }
            showToast('Követés bekapcsolva');
        } else {
            map.dragging.enable();
            if (positionMarker) {
                positionMarker.setLatLng(map.getCenter());
                updateDisplayCoordsFromCenter();
            }
            showToast('Követés kikapcsolva - szabadon navigálhatsz');
        }
    });
    
    document.getElementById('btn-close-layers').addEventListener('click', () => {
        closePanel('layer-panel');
    });
    
    document.getElementById('btn-close-gnss').addEventListener('click', () => {
        closePanel('gnss-panel');
    });
}

function togglePanel(panelId) {
    const panel = document.getElementById(panelId);
    const isHidden = panel.classList.contains('hidden');
    
    document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
    
    if (isHidden) {
        panel.classList.remove('hidden');
    }
}

function closePanel(panelId) {
    document.getElementById(panelId).classList.add('hidden');
}

async function loadCountryBoundary() {
    try {
        const bounds = map.getBounds();
        const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
        
        const query = `
            [out:json][timeout:15];
            relation["admin_level"="2"]["name:hu"~"Magyarország"](${bbox});
            out body;
            >;
            out skel qt;
        `;
        
        console.log('Loading country boundary...');
        const response = await fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query));
        
        if (!response.ok) {
            console.warn('Overpass API error:', response.status);
            return;
        }
        
        const data = await response.json();
        console.log('Country data:', data);
        
        if (countryLayer) {
            map.removeLayer(countryLayer);
            countryLayer = null;
        }
        
        const geojson = osmiumToGeoJSON(data, 'country');
        console.log('Country GeoJSON:', geojson);
        
        if (geojson.features.length > 0) {
            countryLayer = L.geoJSON(geojson, {
                style: getBoundaryStyle('country'),
                interactive: false
            }).addTo(map);
            console.log('Country layer added');
        }
    } catch (err) {
        console.warn('Country load error:', err);
    }
}

async function loadRegionBoundary() {
    try {
        const bounds = map.getBounds();
        const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
        
        const query = `
            [out:json][timeout:20];
            relation["admin_level"="4"]["name:hu"~"."](${bbox});
            out body;
            >;
            out skel qt;
        `;
        
        console.log('Loading region boundary...');
        const response = await fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query));
        
        if (!response.ok) {
            console.warn('Overpass API error:', response.status);
            return;
        }
        
        const data = await response.json();
        console.log('Region data:', data);
        
        if (regionLayer) {
            map.removeLayer(regionLayer);
            regionLayer = null;
        }
        
        const geojson = osmiumToGeoJSON(data, 'region');
        console.log('Region GeoJSON features:', geojson.features.length);
        
        if (geojson.features.length > 0) {
            regionLayer = L.geoJSON(geojson, {
                style: getBoundaryStyle('region'),
                interactive: false
            }).addTo(map);
            console.log('Region layer added');
        }
    } catch (err) {
        console.warn('Region load error:', err);
    }
}

async function loadCityBoundary() {
    try {
        const bounds = map.getBounds();
        const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
        
        const query = `
            [out:json][timeout:25];
            relation["admin_level"="8"]["name:hu"~"."](${bbox});
            out body;
            >;
            out skel qt;
        `;
        
        console.log('Loading city boundary...');
        const response = await fetch('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query));
        
        if (!response.ok) {
            console.warn('Overpass API error:', response.status);
            return;
        }
        
        const data = await response.json();
        console.log('City data:', data);
        
        if (cityLayer) {
            map.removeLayer(cityLayer);
            cityLayer = null;
        }
        
        const geojson = osmiumToGeoJSON(data, 'city');
        console.log('City GeoJSON features:', geojson.features.length);
        
        if (geojson.features.length > 0) {
            cityLayer = L.geoJSON(geojson, {
                style: getBoundaryStyle('city'),
                interactive: false
            }).addTo(map);
            console.log('City layer added');
        }
    } catch (err) {
        console.warn('City load error:', err);
    }
}

function osmiumToGeoJSON(data, type) {
    const features = [];
    
    if (!data.elements) {
        console.log('No elements in data');
        return { type: 'FeatureCollection', features };
    }
    
    console.log('Elements count:', data.elements.length);
    
    const nodes = {};
    const ways = {};
    const relations = {};
    
    data.elements.forEach(el => {
        if (el.type === 'node') nodes[el.id] = el;
        else if (el.type === 'way') ways[el.id] = el;
        else if (el.type === 'relation') relations[el.id] = el;
    });
    
    console.log('Relations:', Object.keys(relations).length, 'Ways:', Object.keys(ways).length, 'Nodes:', Object.keys(nodes).length);
    
    Object.values(relations).forEach(relation => {
        if (!relation.members || relation.members.length === 0) {
            const way = ways[relation.id];
            if (way && way.nodes && way.nodes.length > 2) {
                const coords = way.nodes.map(nodeId => {
                    const node = nodes[nodeId];
                    return node ? [node.lon, node.lat] : null;
                }).filter(c => c !== null);
                
                if (coords.length > 2) {
                    const name = relation.tags?.name || relation.tags?.['name:hu'] || '';
                    features.push({
                        type: 'Feature',
                        properties: { name, type },
                        geometry: { type: 'Polygon', coordinates: [coords] }
                    });
                }
            }
            return;
        }
        
        const allCoords = [];
        
        relation.members.forEach(member => {
            if (member.type !== 'way') return;
            const way = ways[member.ref];
            if (!way || !way.nodes) return;
            
            const wayCoords = way.nodes.map(nodeId => {
                const node = nodes[nodeId];
                return node ? [node.lon, node.lat] : null;
            }).filter(c => c !== null);
            
            if (wayCoords.length > 1) {
                allCoords.push(wayCoords);
            }
        });
        
        if (allCoords.length > 0) {
            const name = relation.tags?.name || relation.tags?.['name:hu'] || '';
            
            if (allCoords.length === 1) {
                features.push({
                    type: 'Feature',
                    properties: { name, type },
                    geometry: { type: 'Polygon', coordinates: allCoords[0] }
                });
            } else {
                features.push({
                    type: 'Feature',
                    properties: { name, type },
                    geometry: { type: 'MultiPolygon', coordinates: [allCoords] }
                });
            }
        }
    });
    
    return { type: 'FeatureCollection', features };
}

function startGeolocation() {
    if (!navigator.geolocation) {
        showToast('A böngésző nem támogatja a GPS-t!');
        return;
    }
    
    const options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
    };
    
    watchId = navigator.geolocation.watchPosition(
        onGeolocationSuccess,
        onGeolocationError,
        options
    );
}

function onGeolocationSuccess(position) {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const accuracy = position.coords.accuracy;
    
    document.getElementById('gps-info-text').innerHTML = `
        <div>⏱ ${new Date().toLocaleTimeString('hu-HU')}</div>
        <div>📍 Pontosság: ${accuracy.toFixed(2)} m</div>
    `;
    
    const statusEl = document.getElementById('gnss-status');
    if (accuracy < 1) {
        statusEl.className = 'status connected';
        statusEl.innerHTML = '<span class="status-icon">●</span><span class="status-text">RTK Fix</span>';
    } else if (accuracy < 5) {
        statusEl.className = 'status connected';
        statusEl.innerHTML = '<span class="status-icon">●</span><span class="status-text">DGPS</span>';
    } else {
        statusEl.className = 'status connected';
        statusEl.innerHTML = '<span class="status-icon">●</span><span class="status-text">GPS aktív</span>';
    }
    
    updatePosition(lat, lon, accuracy);
    
    reverseGeocode(lat, lon);
}

function onGeolocationError(error) {
    let errorMsg = 'GPS hiba';
    
    switch (error.code) {
        case error.PERMISSION_DENIED:
            errorMsg = 'Engedély megtagadva';
            break;
        case error.POSITION_UNAVAILABLE:
            errorMsg = 'GPS nem elérhető';
            break;
        case error.TIMEOUT:
            errorMsg = 'GPS időtúllépés';
            break;
    }
    
    document.getElementById('gnss-status').className = 'status disconnected';
    document.getElementById('gnss-status').innerHTML = 
        '<span class="status-icon">○</span><span class="status-text">' + errorMsg + '</span>';
    
    document.getElementById('gps-info-text').innerHTML = 
        `<div style="color: #f44336;">❌ ${errorMsg}</div>
         <div style="font-size: 11px; color: #888; margin-top: 5px;">
            GNSS Master: Mock Location bekapcsolva?
         </div>`;
}

async function reverseGeocode(lat, lon) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`,
            { headers: { 'User-Agent': 'EdeszetiTerkepekApp/1.0' } }
        );
        const data = await response.json();
        
        const city = data.address?.city || 
                     data.address?.town || 
                     data.address?.village || 
                     data.address?.municipality || '';
        
        if (city) {
            document.getElementById('city-name').textContent = city;
        }
    } catch (err) {
        console.warn('Reverse geocode error:', err);
    }
}

function updatePosition(lat, lon, accuracy) {
    currentPosition = { lat, lon, accuracy };
    
    if (!positionMarker) {
        const gnssIcon = L.divIcon({
            className: 'gnss-marker',
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            html: '<div class="center-dot"></div>'
        });
        positionMarker = L.marker([lat, lon], { icon: gnssIcon }).addTo(map);
    }
    
    if (followMode) {
        document.getElementById('lat').textContent = lat.toFixed(7);
        document.getElementById('lon').textContent = lon.toFixed(7);
        document.getElementById('accuracy').textContent = accuracy.toFixed(2) + ' m';
        positionMarker.setLatLng([lat, lon]);
        map.panTo([lat, lon], { animate: true });
    }
    
    localStorage.setItem('lastPosition', JSON.stringify({ lat, lon }));
}

function formatDMS(decimal, type) {
    const direction = type === 'lat' 
        ? (decimal >= 0 ? 'É' : 'D') 
        : (decimal >= 0 ? 'K' : 'Ny');
    
    const abs = Math.abs(decimal);
    const deg = Math.floor(abs);
    const minFloat = (abs - deg) * 60;
    const min = Math.floor(minFloat);
    const sec = ((minFloat - min) * 60).toFixed(1);
    
    return `${deg}°${min}'${sec}"${direction}`;
}

function loadSavedPosition() {
    const saved = localStorage.getItem('lastPosition');
    if (saved) {
        try {
            const pos = JSON.parse(saved);
            if (pos.lat && pos.lon) {
                map.setView([pos.lat, pos.lon], 12);
            }
        } catch (e) {}
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

document.addEventListener('DOMContentLoaded', init);
