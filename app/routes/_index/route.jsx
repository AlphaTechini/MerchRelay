import { redirect, Form, useLoaderData } from "react-router";
import { getConfiguredShop } from "../../shopify.server";
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
    <div className={styles.index}>
      <div className={styles.content}>
        <h1 className={styles.heading}>MerchRelay</h1>
        <p className={styles.text}>
          A merchant intelligence workspace where an agent researches and
          proposes store improvements while you keep final control.
        </p>
        <Form className={styles.form} method="post" action="/auth/login">
          <input type="hidden" name="shop" value={shop} />
          <button className={styles.button} type="submit">
            Continue to Flash Store
          </button>
        </Form>
        <ul className={styles.list}>
          <li>
            <strong>Analyze</strong> verified products, inventory, orders, and
            performance signals from your store.
          </li>
          <li>
            <strong>Research</strong> public Shopify catalog patterns and
            comparable products.
          </li>
          <li>
            <strong>Approve</strong> evidence-backed proposals before any store
            change is applied.
          </li>
        </ul>
      </div>
    </div>
  );
}
