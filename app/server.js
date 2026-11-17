const os = require("node:os");
const path = require("node:path");
const express = require("express");
const { Pool } = require("pg");

const PORT = process.env.PORT || 3000;

const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDB,
  host: process.env.PGHOST,
});

pool.on("error", (err) => {
  console.error("Base : connexion perdue (" + err.message + ")");
  baseConnectee = false;
  setTimeout(connecterLaBase, 2000);
});

let baseConnectee = false;
let dernierMessage = "";

async function connecterLaBase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS champions (
        id serial PRIMARY KEY,
        nom text NOT NULL,
        lane text NOT NULL,
        region text NOT NULL
      )
    `);

    const { rows } = await pool.query("SELECT count(*)::int AS total FROM champions");
    if (rows[0].total === 0) {
      console.log("Base : table créée");
    }

    baseConnectee = true;
    console.log("Base : connectée");
  } catch (err) {
    baseConnectee = false;
    const message = "Base : non connectée (" + err.message + "), nouvel essai toutes les 2 s";
    if (message !== dernierMessage) console.log(message);
    dernierMessage = message;
    setTimeout(connecterLaBase, 2000);
  }
}

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/sante", (req, res) => {
  res.json({
    api: "ok",
    base: baseConnectee ? "connectée" : "non connectée",
    conteneur: os.hostname(),
  });
});

app.get("/api/champions", async (req, res) => {
  if (!baseConnectee) {
    return res.status(503).json({ erreur: "base non connectée" });
  }
  try {
    const { rows } = await pool.query(
      "SELECT id, nom, lane, region FROM champions ORDER BY nom"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

app.post("/api/champions", async (req, res) => {
  if (!baseConnectee) {
    return res.status(503).json({ erreur: "base non connectée" });
  }
  const { nom, lane, region} = req.body || {};
  if (!nom || !lane || !region) {
    return res.status(400).json({ erreur: "nom, lane, region sont obligatoires" });
  }
  try {
    const { rows } = await pool.query(
      "INSERT INTO champions (nom, lane, region) VALUES ($1, $2, $3) RETURNING id, nom, lane, region",
      [nom, lane, region]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ erreur: err.message });
  }
});

app.listen(PORT, () => {
  console.log("application démarrée sur le port " + PORT);
  connecterLaBase();
});

process.on("SIGTERM", () => {
  console.log("arrêt demandé, au revoir");
  process.exit(0);
});