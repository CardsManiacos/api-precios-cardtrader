
const express = require("express");
const puppeteer = require("puppeteer");
const app = express();

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")    // elimina tildes
    .replace(/[’']/g, "-s-")       // reemplaza apóstrofes por '-s-'
    .replace(/,/g, "")                  // elimina comas
    .replace(/\s+/g, "-")               // reemplaza espacios por guiones
    .trim();
}

app.get("/precioCT0", async (req, res) => {
  let { carta, expansion } = req.query;

  if (!carta || !expansion) {
    return res.status(400).json({ error: "Faltan parámetros" });
  }

  const nombreFormateado = normalizar(carta);
  const expansionFormateada = normalizar(expansion);
  const url = `https://www.cardtrader.com/en/cards/${nombreFormateado}-${expansionFormateada}`;

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.waitForTimeout(2500);

    const precio = await page.evaluate(() => {
      const span = document.querySelector("span.best-deal.my-2");
      if (!span) return "CT0 no encontrado";

      const text = span.textContent.replace("€", "").replace(",", ".").trim();
      return text || "CT0 no encontrado";
    });

    await browser.close();
    res.json({ carta, expansion, precio });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Servidor corriendo en puerto " + PORT));
