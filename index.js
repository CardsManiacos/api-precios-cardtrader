const express = require("express");
const puppeteer = require("puppeteer");
const app = express();
const PORT = process.env.PORT || 3000;

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // elimina tildes
    .replace(/[']/g, "") // elimina apóstrofes
    .replace(/[’]/g, "-s-") // reemplaza apóstrofes especiales por '-s-'
    .replace(/[,]/g, "") // elimina comas
    .replace(/\s+/g, "-") // reemplaza espacios por guiones
    .trim();
}

app.get("/precioCT0", async (req, res) => {
  const nombre = req.query.carta;
  const expansion = req.query.expansion;

  if (!nombre || !expansion) {
    return res.status(400).json({ error: "Faltan parámetros requeridos: carta y expansion." });
  }

  const nombreFormateado = normalizar(nombre);
  const expansionFormateada = normalizar(expansion);

  const url = `https://www.cardtrader.com/cards/${nombreFormateado}-${expansionFormateada}`;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      executablePath: puppeteer.executablePath(),
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });

    const precio = await page.evaluate(() => {
      const span = document.querySelector(".best-price span.price");
      return span ? span.textContent.replace("€", "").trim() : null;
    });

    await browser.close();

    if (precio) {
      res.json({ precio });
    } else {
      res.status(404).json({ error: "No se encontró el precio en la página." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
