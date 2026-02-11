const fs = require("fs");
const path = require("path");

const MEMORY_FILE = path.join(__dirname, "memory.json");

// Ensure memory file exists
function ensureMemoryFile() {
  if (!fs.existsSync(MEMORY_FILE)) {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify({}, null, 2));
  }
}

function readMemory() {
  ensureMemoryFile();
  const data = fs.readFileSync(MEMORY_FILE, "utf8");
  return JSON.parse(data);
}

function writeMemory(obj) {
  fs.writeFileSync(MEMORY_FILE, JSON.stringify(obj, null, 2));
}

function getMemory(key) {
  const mem = readMemory();
  return mem[key];
}

function saveMemory(key, value) {
  const mem = readMemory();
  mem[key] = value;
  writeMemory(mem);
}

module.exports = {
  getMemory,
  saveMemory,
};
