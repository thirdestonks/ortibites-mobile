export interface MapMarker {
  lat: number;
  lng: number;
  color: string;
}

interface MapHtmlOptions {
  lat: number;
  lng: number;
  zoom: number;
  /** false = a still picture of the spot (no pan or zoom) for use inside scrolling screens. */
  interactive?: boolean;
  /** Other places to show as station-coloured dots. */
  markers?: MapMarker[];
}

// Amber teardrop, tip at the bottom centre so the tip is the exact coordinate.
const PIN_SVG =
  '<svg viewBox="0 0 32 44"><path d="M16 1.5C8 1.5 2 7.5 2 15.5c0 11 14 27.5 14 27.5s14-16.5 14-27.5C30 7.5 24 1.5 16 1.5z" fill="#fbbf24" stroke="#1c1208" stroke-width="2.5"/><circle cx="16" cy="15.5" r="5.5" fill="#1c1208"/></svg>';

export function buildMapHtml({
  lat,
  lng,
  zoom,
  interactive = true,
  markers = [],
}: MapHtmlOptions): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <!-- OSM's tile servers block requests that carry no Referer (they return an
       "Access blocked" tile). Send the page origin, set by baseUrl in MapPicker. -->
  <meta name="referrer" content="origin" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { margin: 0; height: 100%; width: 100%; background: #17140f; overflow: hidden; }
    /* "Night Service": invert the standard OSM tiles, then warm them toward the
       app's amber. No dark tile provider (and no API key) needed. */
    .leaflet-tile-pane { filter: invert(1) hue-rotate(180deg) sepia(.6) saturate(1.4) brightness(.95) contrast(1.05); }
    .leaflet-control-attribution { font-size: 8px; background: rgba(0,0,0,.45) !important; color: #a8a29e !important; padding: 0 4px !important; }
    .leaflet-control-attribution a { color: #a8a29e !important; }
    #pinwrap { position: absolute; left: 50%; top: 50%; width: 0; height: 0; z-index: 1000; pointer-events: none; }
    #pin { position: absolute; left: -16px; bottom: 0; width: 32px; height: 44px;
      transition: transform .2s cubic-bezier(.25,1,.5,1); filter: drop-shadow(0 3px 2px rgba(0,0,0,.35)); }
    #pin svg { display: block; width: 100%; height: 100%; }
    #shadow { position: absolute; left: -9px; top: -3px; width: 18px; height: 6px; border-radius: 50%;
      background: rgba(0,0,0,.5); transition: transform .2s cubic-bezier(.25,1,.5,1), opacity .2s; }
    /* Lift while dragging, drop with a shadow on release. */
    body.moving #pin { transform: translateY(-14px); }
    body.moving #shadow { transform: scale(.55); opacity: .45; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div id="pinwrap"><div id="shadow"></div><div id="pin">${PIN_SVG}</div></div>
  <script>
    var interactive = ${interactive ? "true" : "false"};
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false,
      dragging: interactive,
      touchZoom: interactive,
      doubleClickZoom: interactive,
      scrollWheelZoom: interactive,
      boxZoom: interactive,
      keyboard: interactive
    }).setView([${lat}, ${lng}], ${zoom});

    L.control.attribution({ prefix: false, position: 'bottomleft' })
      .addAttribution('&copy; OpenStreetMap contributors').addTo(map);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    ${JSON.stringify(markers)}.forEach(function (m) {
      L.circleMarker([m.lat, m.lng], {
        radius: 7, color: '#0a0a0c', weight: 2.5, fillColor: m.color, fillOpacity: 1
      }).addTo(map);
    });

    var suppress = false;
    var suppressTimer;

    map.on('movestart', function () { document.body.classList.add('moving'); });
    map.on('moveend', function () {
      document.body.classList.remove('moving');
      if (suppress) { suppress = false; return; }   // programmatic move, don't echo it
      var c = map.getCenter();
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ lat: c.lat, lng: c.lng }));
      }
    });

    window.recenter = function (la, ln) {
      suppress = true;
      // If the view doesn't actually change, no moveend fires; don't leave the
      // flag armed or the user's next drag would be swallowed.
      clearTimeout(suppressTimer);
      suppressTimer = setTimeout(function () { suppress = false; }, 900);
      map.setView([la, ln], Math.max(map.getZoom(), 17));
    };
  </script>
</body>
</html>`;
}
