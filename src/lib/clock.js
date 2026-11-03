/**
 * Single source of "now" for the server.
 * Tests call setNow() to pin time. Never use new Date() or SQL NOW() in feature code.
 */
let fixedNow = null;

function now() {
  return fixedNow ? new Date(fixedNow) : new Date();
}

function setNow(isoString) {
  fixedNow = isoString ? new Date(isoString) : null;
}

export { now, setNow };
