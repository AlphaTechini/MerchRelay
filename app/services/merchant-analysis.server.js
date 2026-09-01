import prisma from "../db.server";
import { executeAdminGraphql, summarizeCost } from "./admin-graphql.server";

const MERCHANT_QUERY = `#graphql
  query MerchRelayMerchantContext($ordersQuery: String!) {
    shop {
      name
      myshopifyDomain
      currencyCode
      primaryDomain { host }
    }
    products(first: 50) {
      nodes {
        id
        title
        descriptionHtml
        status
        productType
        vendor
        tags
        totalInventory
        category { fullName }
      }
    }
    collections(first: 50) {
      nodes { id title handle }
    }
    locations(first: 50) {
      nodes { id name isActive }
    }
    orders(first: 50, query: $ordersQuery, sortKey: PROCESSED_AT, reverse: true) {
      nodes {
        id
        createdAt
        currentTotalPriceSet { shopMoney { amount currencyCode } }
        lineItems(first: 50) {
          nodes {
            quantity
            originalUnitPriceSet { shopMoney { amount currencyCode } }
            product { id title productType }
          }
        }
      }
    }
  }
`;

function dateQuery(days) {
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return `created_at:>=${start.toISOString()}`;
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function buildAnalysis(data, cost, days) {
  const productMap = new Map(
    data.products.nodes.map((product) => [product.id, product]),
  );
  const productMetrics = new Map();
  const categoryMetrics = new Map();

  for (const order of data.orders.nodes) {
    for (const lineItem of order.lineItems.nodes) {
      if (!lineItem.product) continue;

      const product = productMap.get(lineItem.product.id) || lineItem.product;
      const category =
        product.category?.fullName || product.productType || "Uncategorized";
      const amount =
        Number(lineItem.originalUnitPriceSet.shopMoney.amount) *
        lineItem.quantity;
      const existingProduct = productMetrics.get(product.id) || {
        id: product.id,
        title: product.title,
        category,
        units: 0,
        sales: 0,
      };
      existingProduct.units += lineItem.quantity;
      existingProduct.sales += amount;
      productMetrics.set(product.id, existingProduct);

      const existingCategory = categoryMetrics.get(category) || {
        name: category,
        units: 0,
        sales: 0,
        products: new Set(),
      };
      existingCategory.units += lineItem.quantity;
      existingCategory.sales += amount;
      existingCategory.products.add(product.id);
      categoryMetrics.set(category, existingCategory);
    }
  }

  const topProducts = [...productMetrics.values()]
    .sort((left, right) => right.sales - left.sales)
    .slice(0, 10);
  const topCategories = [...categoryMetrics.values()]
    .map((category) => ({ ...category, products: category.products.size }))
    .sort((left, right) => right.sales - left.sales)
    .slice(0, 10);
  const inventoryAlerts = data.products.nodes
    .filter(
      (product) => product.status === "ACTIVE" && product.totalInventory <= 0,
    )
    .slice(0, 10)
    .map((product) => ({
      id: product.id,
      title: product.title,
      inventory: product.totalInventory,
    }));
  const opportunities = [
    ...data.products.nodes
      .filter((product) => !product.descriptionHtml?.trim())
      .slice(0, 5)
      .map((product) => ({
        type: "listing_health",
        title: `Improve the description for ${product.title}`,
        productId: product.id,
        reason: "The product has no description.",
      })),
    ...inventoryAlerts.map((product) => ({
      type: "inventory",
      title: `Investigate stock for ${product.title}`,
      productId: product.id,
      reason: "The active product is out of stock.",
    })),
  ];
  const totalSales = sum(
    data.orders.nodes.map((order) =>
      Number(order.currentTotalPriceSet.shopMoney.amount),
    ),
  );

  return {
    periodDays: days,
    shop: data.shop,
    totals: {
      orders: data.orders.nodes.length,
      sales: totalSales,
      currency: data.shop.currencyCode,
      products: data.products.nodes.length,
      locations: data.locations.nodes.length,
      collections: data.collections.nodes.length,
    },
    topProducts,
    topCategories,
    inventoryAlerts,
    opportunities: opportunities.slice(0, 10),
    products: data.products.nodes.map((product) => ({
      id: product.id,
      title: product.title,
      status: product.status,
      productType: product.productType,
      category:
        product.category?.fullName || product.productType || "Uncategorized",
      vendor: product.vendor,
      tags: product.tags,
      totalInventory: product.totalInventory,
    })),
    locations: data.locations.nodes,
    cost: summarizeCost(cost),
  };
}

export async function getMerchantAnalysis(admin, days = 30) {
  const result = await executeAdminGraphql(admin, MERCHANT_QUERY, {
    ordersQuery: dateQuery(days),
  });
  return buildAnalysis(result.data, result.cost, days);
}

export async function getOrCreateMerchantSession(shop, goal) {
  const existing = await prisma.merchantSession.findFirst({
    where: { shop, status: "active" },
    orderBy: { createdAt: "desc" },
  });

  return (
    existing ||
    prisma.merchantSession.create({
      data: { shop, goal },
    })
  );
}

export async function recordActivity(data) {
  return prisma.activityEntry.create({ data });
}
