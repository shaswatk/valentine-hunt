const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 4000;
const DATA_FILE = path.join(__dirname, "data.json");

const ensureDataFile = () => {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ events: [] }, null, 2));
  }
};

const readData = () => {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
};

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

const sendJson = (res, statusCode, body) => {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/puzzle-events") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        if (!payload.deviceId || !payload.event) {
          sendJson(res, 400, { error: "deviceId and event are required" });
          return;
        }
        const data = readData();
        const entry = {
          id: payload.id || `${Date.now()}-${Math.random()}`,
          deviceId: payload.deviceId,
          event: payload.event,
          day: payload.payload?.day ?? payload.day ?? null,
          timestamp: payload.timestamp || new Date().toISOString(),
          meta: payload.payload || {},
        };
        data.events.push(entry);
        writeData(data);
        sendJson(res, 201, { ok: true });
      } catch (error) {
        console.error("Failed to persist puzzle event", error);
        sendJson(res, 500, { error: "Failed to persist event" });
      }
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/puzzle-progress") {
    const deviceId = url.searchParams.get("deviceId");
    if (!deviceId) {
      sendJson(res, 400, { error: "deviceId is required" });
      return;
    }
    const data = readData();
    const solvedEvents = data.events.filter(
      (event) => event.deviceId === deviceId && event.event === "puzzle_solved"
    );
    const solvedDays = Array.from(new Set(solvedEvents.map((event) => event.day))).filter(Boolean);
    sendJson(res, 200, { deviceId, solvedDays });
    return;
  }

  sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`Puzzle tracker API listening on port ${PORT}`);
});
