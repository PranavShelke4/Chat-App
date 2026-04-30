import { customAlphabet } from "nanoid";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generate = customAlphabet(alphabet, 6);

export function generateRoomCode(): string {
  return generate();
}
