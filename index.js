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
    if (!fs.existsSync(DB)) {
      const initial = { users: {} };
      fs.writeFileSync(DB, JSON.stringify(initial, null, 2));
      return initial;
    }
    const data = JSON.parse(fs.readFileSync(DB, "utf8"));
    return { users: data.users || {} };
  } catch (e) {
    return { users: {} };
  }
};

const saveDB = (db) => fs.writeFileSync(DB, JSON.stringify(db, null, 2));

app.get("/", (_, res) => {
  const db = loadDB();
  res.json(db.users);
});

app.get("/stats", (_, res) => {
  const db = loadDB();
  res.json(db.users);
});

app.post("/exec", (req, res) => {
  const { action, nickname, password, license } = req.body;
  if (!action || !nickname || !password) return res.status(400).json({ error: "Missing data" });

  let db = loadDB();
  const userKey = nickname.trim().toLowerCase();

  if (action === "register") {
    if (db.users[userKey]) return res.status(400).json({ status: "error" });

    db.users[userKey] = {
      username: nickname,
      password: password,
      license: license || "N/A"
    };

    saveDB(db);
    return res.status(200).json({ status: "success" });
  }

  if (action === "login") {
    const user = db.users[userKey];
    if (!user || user.password !== password) return res.status(401).json({ status: "error" });

    return res.status(200).json({
      status: "success"
    });
  }

  res.status(404).json({ error: "NotFound" });
});

app.listen(PORT, () => console.log("Servidor iniciado"));
