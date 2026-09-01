import { redirect, Form, useLoaderData } from "react-router";
import { getConfiguredShop } from "../../shopify.server";
import ThemeShell from "../../components/theme-shell";
import styles from "./styles.module.css";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = getConfiguredShop();
  const requestedShop = url.searchParams.get("shop");

  if (requestedShop === shop) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  if (requestedShop) {
    throw redirect(`/auth/login?shop=${encodeURIComponent(shop)}`);
  }

  return { shop };
};

export default function App() {
  const { shop } = useLoaderData();

  return (
    <ThemeShell>
      <main className={styles.index}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>MERCHANT INTELLIGENCE WORKSPACE</p>
          <h1 className={styles.heading}>MerchRelay</h1>
          <p className={styles.text}>
            Research, recommendations, and approved store actions in one clear
            workspace.
          </p>
          <div className={styles.panel}>
            <p className={styles.panelLabel}>Connected development store</p>
            <p className={styles.store}>{shop}</p>
            <Form className={styles.form} method="post" action="/auth/login">
              <input type="hidden" name="shop" value={shop} />
              <button className={styles.button} type="submit">
                Continue to Flash Store
              </button>
            </Form>
          </div>
          <ul className={styles.list}>
            <li>
              <strong>Analyze</strong>
              <span>
                Verified products, inventory, orders, and performance signals.
              </span>
            </li>
            <li>
              <strong>Research</strong>
              <span>
                Public Shopify catalog patterns and comparable products.
              </span>
            </li>
            <li>
              <strong>Approve</strong>
              <span>
                Evidence-backed proposals before any store change is applied.
              </span>
            </li>
          </ul>
        </div>
      </main>
    </ThemeShell>
  );
}
