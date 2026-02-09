import express from "express";
import fs from "fs";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;
const DB = "./db.json";

app.use(cors());
app.use(express.json());

const loadDB = () => {
  try {
    if (fs.existsSync(DB)) {
      const data = fs.readFileSync(DB, "utf8");
      return JSON.parse(data);
    }
  } catch (e) {
    console.log("Error leyendo DB, reintentando...");
  }
  return { users: {} };
};

const saveDB = (db) => {
  try {
    fs.writeFileSync(DB, JSON.stringify(db, null, 2));
  } catch (e) {
    console.log("Error al guardar datos");
  }
};

app.get("/", (_, res) => {
  const db = loadDB();
  res.json(db.users || {});
});

app.get("/stats", (_, res) => {
  const db = loadDB();
  res.json(db.users || {});
});

app.post("/exec", (req, res) => {
  const { action, nickname, password, license } = req.body;
  if (!action || !nickname || !password) return res.status(400).json({ error: "Faltan datos" });

  let db = loadDB();
  if (!db.users) db.users = {};
  
  const userKey = nickname.trim().toLowerCase();

  if (action === "register") {
    if (db.users[userKey]) return res.status(400).json({ status: "error", message: "Ya existe" });

    db.users[userKey] = {
      username: nickname,
      password: password,
      license: license || "N/A",
      registeredAt: new Date().toISOString()
    };

    saveDB(db);
    return res.status(200).json({ status: "success" });
  }

  if (action === "login") {
    const user = db.users[userKey];
    if (!user || user.password !== password) return res.status(401).json({ status: "error" });

    return res.status(200).json({ status: "success" });
  }

  res.status(404).json({ error: "No encontrado" });
});

app.listen(PORT, () => console.log("Servidor iniciado"));
