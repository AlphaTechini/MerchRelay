import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { Badge, Card, WorkspacePage } from "../components/workspace-page";

/* eslint-disable no-undef */

export async function loader({ request }) {
  const { session } = await authenticate.admin(request);
  return {
    shop: session.shop,
    appUrl: process.env.SHOPIFY_APP_URL || "",
    scopes: process.env.SCOPES || "",
    databaseConfigured: Boolean(process.env.DB_PRISMA_DATABASE_URL),
    catalogConfigured: Boolean(process.env.CATALOG_ENDPOINT),
  };
}

export default function SettingsPage() {
  const settings = useLoaderData();

  return (
    <WorkspacePage
      eyebrow="Workspace configuration"
      title="Settings"
      description="Non-secret deployment status for the connected Flash Store workspace. Secrets are never rendered here."
    >
      <Card title="Connected store">
        <ul className="workspace-list">
          <li className="workspace-list-item">
            <strong>Shop</strong>
            <span>{settings.shop}</span>
          </li>
          <li className="workspace-list-item">
            <strong>App URL</strong>
            <span>{settings.appUrl || "Not configured"}</span>
          </li>
          <li className="workspace-list-item">
            <strong>Database</strong>
            <Badge tone={settings.databaseConfigured ? "success" : "danger"}>
              {settings.databaseConfigured ? "Connected" : "Missing"}
            </Badge>
          </li>
          <li className="workspace-list-item">
            <strong>Global Catalog</strong>
            <Badge tone={settings.catalogConfigured ? "success" : "warning"}>
              {settings.catalogConfigured ? "Configured" : "Endpoint needed"}
            </Badge>
          </li>
        </ul>
      </Card>
      <Card title="Access scopes" detail="Current server configuration">
        <pre className="workspace-code">
          {settings.scopes || "No scopes configured."}
        </pre>
      </Card>
    </WorkspacePage>
  );
}

/* eslint-enable no-undef */
