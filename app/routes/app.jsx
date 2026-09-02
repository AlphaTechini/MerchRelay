import { Link, Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { authenticate } from "../shopify.server";
import ThemeShell from "../components/theme-shell";
import WebMcpTools from "../components/webmcp-tools";

export const loader = async ({ request }) => {
  await authenticate.admin(request);

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <ThemeShell>
        <s-app-nav>
          <s-link href="/app">Overview</s-link>
          <s-link href="/app/research">Research</s-link>
          <s-link href="/app/opportunities">Opportunities</s-link>
          <s-link href="/app/proposals">Proposals</s-link>
          <s-link href="/app/activity">Activity</s-link>
          <s-link href="/app/agent">Agent</s-link>
          <s-link href="/app/pairings">Pair agent</s-link>
          <s-link href="/app/settings">Settings</s-link>
        </s-app-nav>
        <nav className="workspace-route-nav" aria-label="MerchRelay workspace">
          <Link to="/app">Overview</Link>
          <Link to="/app/research">Research</Link>
          <Link to="/app/opportunities">Opportunities</Link>
          <Link to="/app/proposals">Proposals</Link>
          <Link to="/app/activity">Activity</Link>
          <Link to="/app/agent">Agent</Link>
          <Link to="/app/pairings">Pair agent</Link>
          <Link to="/app/settings">Settings</Link>
        </nav>
        <WebMcpTools />
        <Outlet />
      </ThemeShell>
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
