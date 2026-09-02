-- Agent pairing secrets are stored only as SHA-256 hashes.
CREATE TABLE "AgentPairing" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "sessionHash" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "claimedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentPairing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AgentPairing_tokenHash_key" ON "AgentPairing"("tokenHash");
CREATE UNIQUE INDEX "AgentPairing_sessionHash_key" ON "AgentPairing"("sessionHash");
CREATE INDEX "AgentPairing_shop_expiresAt_idx" ON "AgentPairing"("shop", "expiresAt");
