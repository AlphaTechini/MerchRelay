import { createHash, randomBytes } from "node:crypto";
import prisma from "../db.server";
import { unauthenticated } from "../shopify.server";

const PAIRING_COOKIE = "__Host-merchrelay_agent_pairing";
const PAIRING_DURATION_MS = 8 * 60 * 60 * 1000;

export class AgentPairingError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.status = status;
  }
}

function hash(secret) {
  return createHash("sha256").update(secret).digest("hex");
}

function secret() {
  return randomBytes(32).toString("base64url");
}

function cookieValue(request) {
  const cookies = request.headers.get("cookie") || "";
  const prefix = `${PAIRING_COOKIE}=`;
  return cookies
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(prefix))
    ?.slice(prefix.length);
}

function cookieHeader(value, maxAge) {
  return `${PAIRING_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export async function createAgentPairing(shop) {
  const appUrl = process.env.SHOPIFY_APP_URL?.trim();
  if (!appUrl)
    throw new Error("SHOPIFY_APP_URL is required to create an agent pairing.");

  const pairingSecret = secret();
  const expiresAt = new Date(Date.now() + PAIRING_DURATION_MS);
  const pairing = await prisma.agentPairing.create({
    data: { shop, tokenHash: hash(pairingSecret), expiresAt },
  });
  const pairingUrl = new URL("/agent/connect", appUrl);
  pairingUrl.searchParams.set("pairing", pairingSecret);

  return { pairing, pairingUrl: pairingUrl.toString() };
}

export async function redeemAgentPairing(pairingSecret) {
  if (!pairingSecret) {
    throw new AgentPairingError(
      "This agent pairing link is missing its one-time secret.",
    );
  }

  const sessionSecret = secret();
  const now = new Date();
  const updated = await prisma.agentPairing.updateMany({
    where: {
      tokenHash: hash(pairingSecret),
      claimedAt: null,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    data: { claimedAt: now, sessionHash: hash(sessionSecret), lastUsedAt: now },
  });
  if (updated.count !== 1) {
    throw new AgentPairingError(
      "This agent pairing link is expired, revoked, or has already been used.",
    );
  }

  const pairing = await prisma.agentPairing.findUnique({
    where: { tokenHash: hash(pairingSecret) },
  });
  const maxAge = Math.max(
    1,
    Math.floor((pairing.expiresAt.getTime() - now.getTime()) / 1000),
  );
  return { pairing, cookie: cookieHeader(sessionSecret, maxAge) };
}

export async function getPairedAgent(request) {
  const sessionSecret = cookieValue(request);
  if (!sessionSecret) return null;

  const now = new Date();
  const pairing = await prisma.agentPairing.findFirst({
    where: {
      sessionHash: hash(sessionSecret),
      revokedAt: null,
      expiresAt: { gt: now },
    },
  });
  if (!pairing) return null;

  const refreshed = await prisma.agentPairing.updateMany({
    where: { id: pairing.id, revokedAt: null, expiresAt: { gt: now } },
    data: { lastUsedAt: now },
  });
  if (refreshed.count !== 1) return null;
  return pairing;
}

export async function requirePairedAgent(request) {
  const pairing = await getPairedAgent(request);
  if (!pairing) {
    throw new AgentPairingError(
      "Agent pairing is missing, expired, or revoked. Use a new merchant-generated pairing link.",
    );
  }
  const { admin } = await unauthenticated.admin(pairing.shop);
  return { admin, pairing, shop: pairing.shop };
}

export async function revokeAgentPairing({ shop, pairingId }) {
  const result = await prisma.agentPairing.updateMany({
    where: { id: pairingId, shop, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (result.count !== 1)
    throw new Error("Active agent pairing not found for this shop.");
}

export async function listAgentPairings(shop) {
  return prisma.agentPairing.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
