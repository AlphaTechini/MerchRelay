import { redirect } from "react-router";
import { getConfiguredShop } from "../../shopify.server";

export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = getConfiguredShop();
  const requestedShop = url.searchParams.get("shop");

  if (requestedShop === shop) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  throw redirect(`/auth/login?shop=${encodeURIComponent(shop)}`);
};

export default function App() {
  return null;
}
