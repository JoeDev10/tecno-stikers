// ===== GOOGLE SHEETS LOADER =====
// Sheets usadas:
//   "Precios"  → 4 columnas: material | 4x4 | 5x5 | 6x6
//   "Imagenes" → 2 columnas: stiker_id | url
//
// Para agregar una foto: pegá el ID del stiker y el link de Imgur en la hoja "Imagenes".
// El resto de los datos (nombres, emojis, categorías) vienen del archivo datos-stikers.js.

const SHEETS_ID = '19Ovw9JC4pxJdH8Ixeq2fHDft-D5mIwzuT9Y0xPGZUN8';

async function cargarDatosDeSheets() {
  if (!SHEETS_ID) return false;
  try {
    const [dataPrecios, dataImagenes] = await Promise.all([
      fetchGSheet('Precios'),
      fetchGSheet('Imagenes')
    ]);
    aplicarPrecios(dataPrecios);
    aplicarImagenes(dataImagenes);
    return true;
  } catch (e) {
    console.warn('Google Sheets no disponible, usando datos locales.', e);
    return false;
  }
}

function fetchGSheet(hoja) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEETS_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(hoja)}`;
  return fetch(url)
    .then(r => {
      if (!r.ok) throw new Error('Error HTTP ' + r.status);
      return r.text();
    })
    .then(text => {
      const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/);
      if (!match) throw new Error('Respuesta inesperada de Google Sheets');
      return JSON.parse(match[1]);
    });
}

function aplicarPrecios(data) {
  if (!data.table || !data.table.rows) return;
  data.table.rows.forEach(row => {
    const mat = row.c[0]?.v?.toString().trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (mat && PRECIOS[mat]) {
      if (row.c[1]?.v != null) PRECIOS[mat]['4x4'] = Number(row.c[1].v);
      if (row.c[2]?.v != null) PRECIOS[mat]['5x5'] = Number(row.c[2].v);
      if (row.c[3]?.v != null) PRECIOS[mat]['6x6'] = Number(row.c[3].v);
    }
  });
}

function aplicarImagenes(data) {
  if (!data.table || !data.table.rows) return;

  // Construir mapa stiker_id → url para búsqueda rápida
  const mapaImagenes = {};
  data.table.rows.forEach(row => {
    const id  = row.c[0]?.v?.toString().trim();
    const url = row.c[1]?.v?.toString().trim();
    if (id && url) mapaImagenes[id] = url;
  });

  // Patchear la imagen en cada stiker del catálogo local
  Object.values(catalogos).forEach(cat => {
    cat.stikers.forEach(stiker => {
      if (mapaImagenes[stiker.id]) {
        stiker.imagen = mapaImagenes[stiker.id];
      }
    });
  });
}
