// ===== GOOGLE SHEETS LOADER =====
// El cliente solo necesita cambiar SHEETS_ID con el ID de su hoja de Google Sheets.
// Si SHEETS_ID está vacío, la web usa los datos del archivo datos-stikers.js.

const SHEETS_ID = '19Ovw9JC4pxJdH8Ixeq2fHDft-D5mIwzuT9Y0xPGZUN8';

async function cargarDatosDeSheets() {
  if (!SHEETS_ID) return false;
  try {
    const [dataStikers, dataPrecios] = await Promise.all([
      fetchGSheet('Stikers'),
      fetchGSheet('Precios')
    ]);
    aplicarPrecios(dataPrecios);
    aplicarStikers(dataStikers);
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

function aplicarStikers(data) {
  if (!data.table || !data.table.rows) return;

  // Detectar qué categorías vienen en Sheets para solo tocar esas
  const catsEnSheets = new Set();
  data.table.rows.forEach(row => {
    const cat_id = row.c[0]?.v?.toString().trim();
    if (cat_id) catsEnSheets.add(cat_id);
  });

  // Vaciar solo los catálogos que Sheets va a reemplazar
  catsEnSheets.forEach(k => {
    if (catalogos[k]) catalogos[k].stikers = [];
  });

  data.table.rows.forEach(row => {
    const cat_id     = row.c[0]?.v?.toString().trim();
    const cat_nombre = row.c[1]?.v?.toString().trim();
    const cat_emoji  = row.c[2]?.v?.toString().trim();
    const stiker_id  = row.c[3]?.v?.toString().trim();
    const stiker_nom = row.c[4]?.v?.toString().trim();
    const stiker_emo = row.c[5]?.v?.toString().trim();
    const stiker_img = row.c[6]?.v?.toString().trim() || '';

    if (!cat_id || !stiker_id) return;

    if (!catalogos[cat_id]) {
      catalogos[cat_id] = { nombre: cat_nombre, emoji: cat_emoji, color: cat_id + '-bg', stikers: [] };
    } else {
      catalogos[cat_id].nombre = cat_nombre;
      catalogos[cat_id].emoji  = cat_emoji;
    }

    catalogos[cat_id].stikers.push({
      id:     stiker_id,
      nombre: stiker_nom,
      emoji:  stiker_emo,
      imagen: stiker_img
    });
  });

  // Eliminar solo los catálogos de Sheets que quedaron vacíos (removidos de la hoja)
  catsEnSheets.forEach(k => {
    if (catalogos[k] && catalogos[k].stikers.length === 0) delete catalogos[k];
  });
}
