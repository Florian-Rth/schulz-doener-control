import type { SvgIconComponent } from "@mui/icons-material";
import AccountBalanceWalletOutlined from "@mui/icons-material/AccountBalanceWalletOutlined";
import AddOutlined from "@mui/icons-material/AddOutlined";
import ArrowBackOutlined from "@mui/icons-material/ArrowBackOutlined";
import CampaignOutlined from "@mui/icons-material/CampaignOutlined";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import ChevronRightOutlined from "@mui/icons-material/ChevronRightOutlined";
import DirectionsCarOutlined from "@mui/icons-material/DirectionsCarOutlined";
import EmojiEventsOutlined from "@mui/icons-material/EmojiEventsOutlined";
import EuroOutlined from "@mui/icons-material/EuroOutlined";
import FastfoodOutlined from "@mui/icons-material/FastfoodOutlined";
import KebabDiningOutlined from "@mui/icons-material/KebabDiningOutlined";
import LocalFireDepartmentOutlined from "@mui/icons-material/LocalFireDepartmentOutlined";
import LocalPizzaOutlined from "@mui/icons-material/LocalPizzaOutlined";
import LunchDiningOutlined from "@mui/icons-material/LunchDiningOutlined";
import NoMealsOutlined from "@mui/icons-material/NoMealsOutlined";
import NotificationsActiveOutlined from "@mui/icons-material/NotificationsActiveOutlined";
import PaymentsOutlined from "@mui/icons-material/PaymentsOutlined";
import PrintOutlined from "@mui/icons-material/PrintOutlined";
import RestaurantOutlined from "@mui/icons-material/RestaurantOutlined";
import SetMealOutlined from "@mui/icons-material/SetMealOutlined";
import TakeoutDiningOutlined from "@mui/icons-material/TakeoutDiningOutlined";
import WorkspacePremiumOutlined from "@mui/icons-material/WorkspacePremiumOutlined";
import WrapTextOutlined from "@mui/icons-material/WrapTextOutlined";

// CSP-safe string -> MUI SVG mapping (no CDN icon font). The backend / mock
// emit Material Icons Outlined names as plain strings (`MenuItem.MaterialIcon`,
// the screen markup); we resolve them here to bundled SVG icon components.
// Keys mirror the snake_case Material Symbols names used across the mock.
export const ICON_MAP = {
  account_balance_wallet: AccountBalanceWalletOutlined,
  add: AddOutlined,
  arrow_back: ArrowBackOutlined,
  campaign: CampaignOutlined,
  check: CheckOutlined,
  check_circle: CheckCircleOutlined,
  chevron_right: ChevronRightOutlined,
  directions_car: DirectionsCarOutlined,
  emoji_events: EmojiEventsOutlined,
  euro: EuroOutlined,
  fastfood: FastfoodOutlined,
  kebab_dining: KebabDiningOutlined,
  local_fire_department: LocalFireDepartmentOutlined,
  local_pizza: LocalPizzaOutlined,
  lunch_dining: LunchDiningOutlined,
  no_meals: NoMealsOutlined,
  notifications_active: NotificationsActiveOutlined,
  payments: PaymentsOutlined,
  print: PrintOutlined,
  restaurant: RestaurantOutlined,
  set_meal: SetMealOutlined,
  takeout_dining: TakeoutDiningOutlined,
  workspace_premium: WorkspacePremiumOutlined,
  wrap_text: WrapTextOutlined,
} satisfies Record<string, SvgIconComponent>;

export type MaterialIconName = keyof typeof ICON_MAP;

export const isMaterialIconName = (name: string): name is MaterialIconName =>
  Object.hasOwn(ICON_MAP, name);
