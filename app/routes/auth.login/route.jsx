import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { redirect, Form, useActionData, useLoaderData } from "react-router";
import ThemeShell from "../../components/theme-shell";
import { getConfiguredShop, login } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

async function ensureConfiguredShop(request) {
  const shop = getConfiguredShop();

  if (request.method === "GET") {
    if (new URL(request.url).searchParams.get("shop") !== shop) {
      throw redirect(`/auth/login?shop=${encodeURIComponent(shop)}`);
    }

    return;
  }

  const formData = await request.clone().formData();
  if (formData.get("shop") !== shop) {
    throw redirect(`/auth/login?shop=${encodeURIComponent(shop)}`);
  }
}

export const loader = async ({ request }) => {
  await ensureConfiguredShop(request);
  const errors = loginErrorMessage(await login(request));

  return { errors, shop: getConfiguredShop() };
};

export const action = async ({ request }) => {
  await ensureConfiguredShop(request);
  const errors = loginErrorMessage(await login(request));

  return {
    errors,
    shop: getConfiguredShop(),
  };
};

export default function Auth() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const { errors, shop } = actionData || loaderData;

  return (
    <AppProvider embedded={false}>
      <ThemeShell>
        <s-page>
          <Form method="post">
            <s-section heading="Log in">
              <input type="hidden" name="shop" value={shop} />
              <s-paragraph>
                Continue to Flash Store to authenticate.
              </s-paragraph>
              {errors.shop && <s-text tone="critical">{errors.shop}</s-text>}
              <s-button type="submit">Continue to Flash Store</s-button>
            </s-section>
          </Form>
        </s-page>
      </ThemeShell>
    </AppProvider>
  );
}
