export function buildMapHtml(lat: number, lng: number, zoom: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin: 0; height: 100%; width: 100%; background: #09090b; }
    .leaflet-control-attribution { font-size: 8px; }
    #pin {
      position: absolute; left: 50%; top: 50%;
      width: 28px; height: 28px; margin-left: -14px; margin-top: -28px;
      z-index: 1000; pointer-events: none; font-size: 26px; line-height: 28px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="pin">📍</div>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: true })
      .setView([${lat}, ${lng}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    var suppress = false;
    function post() {
      if (suppress) { suppress = false; return; }
      var c = map.getCenter();
      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: c.lat, lng: c.lng }));
    }
    map.on('moveend', post);

    window.recenter = function (la, ln) {
      suppress = true;           // don't echo this programmatic move back to RN
      map.setView([la, ln], map.getZoom());
    };
  </script>
</body>
</html>`;
}
