"use client";

export type RoomRole = "admin" | "member";

export interface RecentRoom {
  code: string;
  name: string;
  userName: string;
  role: RoomRole;
  passwordProtected: boolean;
  lastOpened: string;
}

const STORAGE_KEY = "chatroom_recent_rooms";
const MAX_RECENT_ROOMS = 8;

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readRooms(): RecentRoom[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as RecentRoom[];
    return Array.isArray(parsed)
      ? parsed.filter((room) => room && typeof room.code === "string" && typeof room.userName === "string")
      : [];
  } catch {
    return [];
  }
}

function writeRooms(rooms: RecentRoom[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms.slice(0, MAX_RECENT_ROOMS)));
}

export function getRecentRooms(): RecentRoom[] {
  return readRooms().sort((a, b) => b.lastOpened.localeCompare(a.lastOpened));
}

export function getRecentRoom(code: string): RecentRoom | null {
  return getRecentRooms().find((room) => room.code === code.toUpperCase()) ?? null;
}

export function upsertRecentRoom(room: Omit<RecentRoom, "lastOpened">): RecentRoom | null {
  if (!canUseStorage()) return null;

  const nextRoom: RecentRoom = {
    ...room,
    code: room.code.toUpperCase(),
    lastOpened: new Date().toISOString(),
  };

  const rooms = readRooms().filter((item) => item.code !== nextRoom.code);
  rooms.unshift(nextRoom);
  writeRooms(rooms);
  return nextRoom;
}

export function removeRecentRoom(code: string) {
  if (!canUseStorage()) return;

  const rooms = readRooms().filter((room) => room.code !== code.toUpperCase());
  writeRooms(rooms);
}

export function updateRoomUserName(code: string, newName: string) {
  if (!canUseStorage()) return;

  const rooms = readRooms().map((room) =>
    room.code === code.toUpperCase() ? { ...room, userName: newName } : room
  );
  writeRooms(rooms);
}
