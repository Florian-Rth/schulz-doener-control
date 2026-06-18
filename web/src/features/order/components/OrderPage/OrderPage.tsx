import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useNavigate } from "@tanstack/react-router";
import type { FC } from "react";
import { PageLayout, PrimaryButton } from "@/components";
import { orderCopy } from "../../copy";
import { useOrderFormContext } from "../../order-context";
import { ExtraField } from "./internal/ExtraField";
import { MeatField } from "./internal/MeatField";
import { OrderHeader } from "./internal/OrderHeader";
import { PickupToggleCard } from "./internal/PickupToggleCard";
import { PizzaVariantField } from "./internal/PizzaVariantField";
import { PriceField } from "./internal/PriceField";
import { ProductGridField } from "./internal/ProductGridField";
import { SauceField } from "./internal/SauceField";
import { SectionLabel } from "./internal/SectionLabel";

// Layout shell for the order screen. Arranges the product grid, the kind-gated
// conditional fields, the extra/price/pickup inputs and the submit CTA. All
// state comes from the order context — this component holds no logic.
export const OrderPage: FC = () => {
  const navigate = useNavigate();
  const { meatVisible, pizzaVisible, submitDisabled, isSubmitting, serverError, onSubmit } =
    useOrderFormContext();

  const goHome = (): void => {
    void navigate({ to: "/" });
  };

  return (
    <PageLayout bg="app" safeAreaTop={54}>
      <PageLayout.Header>
        <OrderHeader onBack={goHome} />
      </PageLayout.Header>
      <PageLayout.Content>
        <Stack component="form" onSubmit={onSubmit} sx={{ gap: 2.25 }} noValidate>
          <Stack sx={{ gap: 1.25 }}>
            <SectionLabel variant="eyebrow" label={orderCopy.productSection} />
            <ProductGridField />
          </Stack>

          {pizzaVisible ? <PizzaVariantField /> : null}
          {meatVisible ? <MeatField /> : null}
          {meatVisible ? <SauceField /> : null}

          <ExtraField />
          <PriceField />
          <PickupToggleCard />

          {serverError !== null ? (
            <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "primary.main" }}>
              {serverError}
            </Typography>
          ) : null}

          <PrimaryButton
            type="submit"
            disabled={submitDisabled}
            loading={isSubmitting}
            startIcon="check_circle"
          >
            {orderCopy.submit}
          </PrimaryButton>
        </Stack>
      </PageLayout.Content>
    </PageLayout>
  );
};
