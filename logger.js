const fs = require("fs");
const path = require("path");

const logFile = path.join(__dirname, "server.log");

const logStream = fs.createWriteStream(logFile, { flags: "a" });

const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = function (...args) {
  const message = `[LOG] ${new Date().toISOString()} - ${args.join(" ")}\n`;
  logStream.write(message);
  originalLog.apply(console, args);
};

console.error = function (...args) {
  const message = `[ERROR] ${new Date().toISOString()} - ${args.join(" ")}\n`;
  logStream.write(message);
  originalError.apply(console, args);
};

console.warn = function (...args) {
  const message = `[WARN] ${new Date().toISOString()} - ${args.join(" ")}\n`;
  logStream.write(message);
  originalWarn.apply(console, args);
};

module.exports = logStream;
