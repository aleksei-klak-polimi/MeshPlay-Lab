export function serializeFrame(frame) {
  return JSON.stringify(frame);
}

export function parseFrame(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}
