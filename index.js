const express = require('express');
const puppeteer = require('puppeteer-core');
const app = express();
const PORT = process.env.PORT || 3000;

function normalizar(texto) {
  return texto
    .toLowerCase()
    .replace(/[’']/g, '-s-')
    .replace(/,/g, '')
    .replace(/\s+/g, '-')
    .normalize('NFD').replace(/[̀-ͯ]/g, '');
}

app.get('/precioCT0', async (req, res) => {
  const carta = req.query.carta;
  const expansion = req.query.expansion;

  if (!carta || !expansion) {
    return res.status(400).json({ error: 'Faltan parámetros: carta y expansion' });
  }

  const cartaSlug = normalizar(carta);
  const expansionSlug = normalizar(expansion);
  const url = `https://www.cardtrader.com/en/cards/${cartaSlug}-${expansionSlug}`;

  try {
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const precio = await page.evaluate(() => {
      const row = document.querySelector('table tbody tr');
      return row ? row.querySelector('td span')?.textContent?.trim() : null;
    });

    await browser.close();

    if (!precio) {
      return res.status(404).json({ error: 'Precio no encontrado', carta, expansion });
    }

    return res.json({ carta, expansion, precio });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor funcionando en el puerto ${PORT}`);
});