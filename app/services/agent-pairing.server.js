import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
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
  const expiration = maxAge ? `; Max-Age=${maxAge}` : "";
  return `${PAIRING_COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax${expiration}`;
}

export async function createAgentPairing(shop, { longLived = false } = {}) {
  const appUrl = process.env.SHOPIFY_APP_URL?.trim();
  if (!appUrl)
    throw new Error("SHOPIFY_APP_URL is required to create an agent pairing.");

  const pairingSecret = secret();
  const expiresAt = longLived
    ? null
    : new Date(Date.now() + PAIRING_DURATION_MS);
  const pairing = await prisma.agentPairing.create({
    data: { shop, tokenHash: hash(pairingSecret), expiresAt },
  });
  const pairingUrl = new URL("/agent/connect", appUrl);
  pairingUrl.searchParams.set("pairing", pairingSecret);

  return {
    pairing,
    pairingUrl: pairingUrl.toString(),
    pairingType: longLived ? "long_lived" : "one_time",
  };
}

export async function redeemAgentPairing(pairingSecret) {
  if (!pairingSecret) {
    throw new AgentPairingError(
      "This agent pairing link is missing its secret.",
    );
  }

  const now = new Date();
  const pairing = await prisma.agentPairing.findFirst({
    where: {
      tokenHash: hash(pairingSecret),
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });
  if (!pairing) {
    throw new AgentPairingError(
      "This agent pairing link is expired, revoked, or has already been used.",
    );
  }

  if (!pairing.expiresAt) {
    await prisma.agentPairing.update({
      where: { id: pairing.id },
      data: { claimedAt: pairing.claimedAt || now, lastUsedAt: now },
    });
    return { pairing, cookie: cookieHeader(pairingSecret) };
  }

  const sessionSecret = secret();
  const claimed = await prisma.agentPairing.updateMany({
    where: {
      id: pairing.id,
      claimedAt: null,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    data: { claimedAt: now, sessionHash: hash(sessionSecret), lastUsedAt: now },
  });
  if (claimed.count !== 1) {
    throw new AgentPairingError(
      "This agent pairing link is expired, revoked, or has already been used.",
    );
  }

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
  const secretHash = hash(sessionSecret);
  const pairing = await prisma.agentPairing.findFirst({
    where: {
      revokedAt: null,
      OR: [
        { sessionHash: secretHash, expiresAt: { gt: now } },
        { tokenHash: secretHash, expiresAt: null },
      ],
    },
  });
  if (!pairing) return null;

  const refreshed = await prisma.agentPairing.updateMany({
    where: {
      id: pairing.id,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    data: { lastUsedAt: now },
  });
  if (refreshed.count !== 1) return null;
  return pairing;
}

export function requireJudgeApprovalToken(token) {
  const expected = process.env.JUDGE_AGENT_APPROVAL_TOKEN;
  if (!expected) {
    throw new AgentPairingError(
      "JUDGE_AGENT_APPROVAL_TOKEN is required to approve paired-agent proposals.",
      503,
    );
  }
  if (typeof token !== "string") {
    throw new AgentPairingError("A judge approval token is required.", 403);
  }

  const expectedBytes = Buffer.from(expected);
  const tokenBytes = Buffer.from(token);
  if (
    expectedBytes.length !== tokenBytes.length ||
    !timingSafeEqual(expectedBytes, tokenBytes)
  ) {
    throw new AgentPairingError("The judge approval token is invalid.", 403);
  }
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
