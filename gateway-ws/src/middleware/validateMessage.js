export default function validateMessage(msg) {
  return (
    msg &&
    typeof msg.type === "string" &&
    typeof msg.payload === "object"
  );
}
