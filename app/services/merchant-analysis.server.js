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

const SHOPIFYQL_QUERY = `#graphql
  query MerchRelaySalesReport($query: String!) {
    shopifyqlQuery(query: $query) {
      tableData {
        columns { name dataType displayName }
        rows
      }
      parseErrors
    }
  }
`;

function reportingError(error) {
  const message =
    error.errors?.map((item) => item.message).join(" ") ||
    (error.message === "Shopify Admin GraphQL request failed."
      ? ""
      : error.message || "");
  const normalized = message.toLowerCase();

  if (
    normalized.includes("level 2") ||
    normalized.includes("protected customer")
  ) {
    return {
      code: "protected_customer_data",
      message:
        "ShopifyQL requires Level 2 protected customer-data access for this app, even for aggregate reports.",
    };
  }

  if (normalized.includes("read_reports")) {
    return {
      code: "read_reports_scope",
      message: "The installed app has not been granted the read_reports scope.",
    };
  }

  if (message) return { code: "shopifyql_error", message };

  return {
    code: "shopifyql_response_error",
    message:
      "Shopify returned no usable ShopifyQL response. Check the deployed app logs for the request failure.",
  };
}

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
  const rankedProducts = data.products.nodes
    .map((product) => {
      const metric = productMetrics.get(product.id);
      return {
        id: product.id,
        title: product.title,
        category:
          product.category?.fullName || product.productType || "Uncategorized",
        units: metric?.units || 0,
        sales: metric?.sales || 0,
        inventory: product.totalInventory,
        sellThrough:
          metric?.units || product.totalInventory > 0
            ? Number(
                (
                  ((metric?.units || 0) /
                    ((metric?.units || 0) +
                      Math.max(product.totalInventory, 0))) *
                  100
                ).toFixed(1),
              )
            : null,
      };
    })
    .sort((left, right) => right.sales - left.sales);
  const topCategories = [...categoryMetrics.values()]
    .map((category) => ({ ...category, products: category.products.size }))
    .sort((left, right) => right.sales - left.sales)
    .slice(0, 10);
  const categories = [
    ...new Map(
      data.products.nodes.map((product) => {
        const name =
          product.category?.fullName || product.productType || "Uncategorized";
        return [name, { name, products: 0, sales: 0, units: 0 }];
      }),
    ).values(),
  ]
    .map((category) => {
      const performance = categoryMetrics.get(category.name);
      return {
        ...category,
        products: data.products.nodes.filter(
          (product) =>
            (product.category?.fullName ||
              product.productType ||
              "Uncategorized") === category.name,
        ).length,
        sales: performance?.sales || 0,
        units: performance?.units || 0,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
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
  const topCategory = topCategories[0] || null;
  const topProduct =
    rankedProducts.find((product) => product.sales > 0) || null;
  const underperformingProducts = rankedProducts
    .filter((product) => product.inventory > 0 && product.sales === 0)
    .slice(0, 10);
  const totalUnitsSold = sum(rankedProducts.map((product) => product.units));
  const totalAvailableInventory = sum(
    rankedProducts.map((product) => Math.max(product.inventory, 0)),
  );
  const recommendedResearch = topCategory
    ? {
        category: topCategory.name,
        query: `${topCategory.name} comparable products`,
        reason: `This is the strongest verified category in the last ${days} days with ${topCategory.units} units and ${topCategory.sales.toFixed(2)} in sales.`,
      }
    : {
        category: "Catalog health",
        query: "product listing best practices",
        reason:
          "No recent category sales were available, so research begins with catalog health instead of a sales claim.",
      };

  return {
    generatedAt: new Date().toISOString(),
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
    rankedProducts,
    topCategories,
    categories,
    topCategory,
    topProduct,
    underperformingProducts,
    averageOrderValue:
      data.orders.nodes.length > 0
        ? totalSales / data.orders.nodes.length
        : null,
    inventorySellThrough:
      totalUnitsSold + totalAvailableInventory > 0
        ? Number(
            (
              (totalUnitsSold / (totalUnitsSold + totalAvailableInventory)) *
              100
            ).toFixed(1),
          )
        : null,
    recommendedResearch,
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
      descriptionHtml: product.descriptionHtml,
      totalInventory: product.totalInventory,
    })),
    locations: data.locations.nodes,
    cost: summarizeCost(cost),
  };
}

async function getSalesReport(admin, days) {
  const query = `FROM sales SHOW total_sales, net_sales, orders, average_order_value TIMESERIES day SINCE startOfDay(-${days}d) UNTIL today ORDER BY day ASC`;

  try {
    const result = await executeAdminGraphql(admin, SHOPIFYQL_QUERY, { query });
    const report = result.data?.shopifyqlQuery;
    if (!report) {
      return {
        available: false,
        error: {
          code: "shopifyql_empty_response",
          message:
            "Shopify returned an empty ShopifyQL response for this session.",
        },
      };
    }
    if (report.parseErrors?.length) {
      return {
        available: false,
        error: {
          code: "shopifyql_parse_error",
          message: report.parseErrors.join(" "),
        },
      };
    }
    if (!report.tableData) {
      return {
        available: false,
        error: {
          code: "shopifyql_no_data",
          message: "ShopifyQL returned no report data for this period.",
        },
      };
    }
    return {
      available: true,
      columns: report.tableData.columns,
      rows: report.tableData.rows,
      cost: summarizeCost(result.cost),
    };
  } catch (error) {
    return {
      available: false,
      error: reportingError(error),
    };
  }
}

export async function getMerchantAnalysis(admin, days = 30) {
  const result = await executeAdminGraphql(admin, MERCHANT_QUERY, {
    ordersQuery: dateQuery(days),
  });
  const analysis = buildAnalysis(result.data, result.cost, days);
  analysis.reporting = await getSalesReport(admin, days);
  return analysis;
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
