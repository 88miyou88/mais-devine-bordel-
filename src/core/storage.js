import { safeParse } from "./utils.js";

export function readJsonStorage(key, fallback, onError = null) {
  return safeParse(localStorage.getItem(key), fallback, onError);
}

export function writeJsonStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function readTextStorage(key, fallback = "") {
  return localStorage.getItem(key) ?? fallback;
}

export function writeTextStorage(key, value) {
  localStorage.setItem(key, String(value));
}
