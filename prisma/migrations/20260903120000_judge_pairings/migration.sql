-- Long-lived judge links have no expiration. Proposal attribution prevents one pairing from executing another pairing's work.
ALTER TABLE "AgentPairing" ALTER COLUMN "expiresAt" DROP NOT NULL;

ALTER TABLE "Proposal" ADD COLUMN "createdByPairingId" TEXT;

CREATE INDEX "Proposal_createdByPairingId_idx" ON "Proposal"("createdByPairingId");

ALTER TABLE "Proposal"
ADD CONSTRAINT "Proposal_createdByPairingId_fkey"
FOREIGN KEY ("createdByPairingId") REFERENCES "AgentPairing"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
