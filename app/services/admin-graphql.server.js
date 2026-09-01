const MAX_ATTEMPTS = 4;
const MAX_BACKOFF_MS = 10_000;

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

function getThrottleDelay(cost, attempt) {
  const restoreRate = cost?.throttleStatus?.restoreRate || 50;
  const requested = cost?.requestedQueryCost || 1;
  const calculated = Math.ceil((requested / restoreRate) * 1000);
  return Math.min(MAX_BACKOFF_MS, Math.max(1000, calculated * attempt));
}

function isThrottled(errors) {
  return errors.some(
    (error) =>
      error?.extensions?.code === "THROTTLED" ||
      error?.message?.toLowerCase().includes("throttled"),
  );
}

export class AdminGraphqlError extends Error {
  constructor(message, { errors = [], cost = null } = {}) {
    super(message);
    this.name = "AdminGraphqlError";
    this.errors = errors;
    this.cost = cost;
  }
}

export async function executeAdminGraphql(admin, query, variables = {}) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const response = await admin.graphql(query, { variables });
    const payload = await response.json();
    const errors = payload.errors || [];
    const cost = payload.extensions?.cost || null;

    if (errors.length === 0) {
      return { data: payload.data, cost };
    }

    if (isThrottled(errors) && attempt < MAX_ATTEMPTS) {
      await sleep(getThrottleDelay(cost, attempt));
      continue;
    }

    throw new AdminGraphqlError("Shopify Admin GraphQL request failed.", {
      errors,
      cost,
    });
  }

  throw new AdminGraphqlError(
    "Shopify Admin GraphQL request exhausted retries.",
  );
}

export function summarizeCost(cost) {
  if (!cost) return null;

  return {
    requested: cost.requestedQueryCost ?? null,
    actual: cost.actualQueryCost ?? null,
    available: cost.throttleStatus?.currentlyAvailable ?? null,
    restoreRate: cost.throttleStatus?.restoreRate ?? null,
  };
}
