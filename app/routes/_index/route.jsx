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
        <h1 className={styles.heading}>A short heading about [your app]</h1>
        <p className={styles.text}>
          A tagline about [your app] that describes your value proposition.
        </p>
        <Form className={styles.form} method="post" action="/auth/login">
          <input type="hidden" name="shop" value={shop} />
          <button className={styles.button} type="submit">
            Continue to Flash Store
          </button>
        </Form>
        <ul className={styles.list}>
          <li>
            <strong>Product feature</strong>. Some detail about your feature and
            its benefit to your customer.
          </li>
          <li>
            <strong>Product feature</strong>. Some detail about your feature and
            its benefit to your customer.
          </li>
          <li>
            <strong>Product feature</strong>. Some detail about your feature and
            its benefit to your customer.
          </li>
        </ul>
      </div>
    </div>
  );
}
