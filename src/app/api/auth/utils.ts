import crypto from "crypto";

// Senha fixa (em produção deveria estar em variável de ambiente)
const ADMIN_PASSWORD = process.env.serverPassword;

// Armazenar tokens válidos (em produção deveria estar em Redis/DB)
const validTokens = new Set<string>();

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function isValidToken(token: string): boolean {
  return validTokens.has(token);
}

export function addToken(token: string): void {
  validTokens.add(token);
}

export function removeToken(token: string): void {
  validTokens.delete(token);
}

export function validatePassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}
