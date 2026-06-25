import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  AdminMenuResponseSchema,
  AdminNotificationTemplatesResponseSchema,
  AdminPizzaVariantsResponseSchema,
  AdminRegistrationModeResponseSchema,
  AdminTiereResponseSchema,
  AdminUsersResponseSchema,
  CreateUserResponseSchema,
  MenuItemResponseSchema,
  NotificationTemplateResponseSchema,
  PizzaVariantResponseSchema,
  ResetPasswordResponseSchema,
  UpdateUserResponseSchema,
} from "./schemas";
import type {
  AdminMenuItem,
  AdminNotificationTemplate,
  AdminPizzaVariant,
  AdminRegistrationMode,
  AdminTiere,
  AdminUser,
  CreateUserResponse,
  MenuKind,
  RegistrationModeNumber,
  ResetPasswordResponse,
  RoleNumber,
} from "./types";

export const adminKeys = {
  users: ["admin", "users"] as const,
  menu: ["admin", "menu"] as const,
  pizzaVariants: ["admin", "pizza-variants"] as const,
  tiere: ["admin", "tiere"] as const,
  notificationTemplates: ["admin", "notification-templates"] as const,
  registrationMode: ["admin", "registration-mode"] as const,
};

// The pwa-gate feature's client-config query key. Duplicated here (rather than imported, since
// features never import other features) so updating the registration mode can invalidate the
// client config the login/register screens read, keeping that policy in sync without a reload.
const clientConfigKey = ["config", "client"] as const;

// The order feature's public menu query key (`orderKeys.menu`). Duplicated here (features never
// import other features) so a pizza-variant mutation can invalidate the order form's menu
// vocabulary, surfacing added / edited / removed variants without a reload.
const orderMenuKey = ["order", "menu"] as const;

// Maps the form's PascalCase role to the numeric wire value the backend expects
// on create/update requests (1 = Employee, 2 = Admin).
export const roleToNumber = (role: "Admin" | "Employee"): RoleNumber => (role === "Admin" ? 2 : 1);

const fetchUsers = async (signal: AbortSignal): Promise<AdminUser[]> => {
  const data = await apiClient.get("/api/admin/users", signal);
  return AdminUsersResponseSchema.parse(data).users;
};

export const useAdminUsers = () =>
  useQuery({
    queryKey: adminKeys.users,
    queryFn: ({ signal }) => fetchUsers(signal),
    staleTime: 30 * 1000,
  });

export interface CreateUserInput {
  username: string;
  displayName: string;
  payPalHandle?: string;
  role: RoleNumber;
}

const createUser = async (input: CreateUserInput): Promise<CreateUserResponse> => {
  const data = await apiClient.post("/api/admin/users", { ...input });
  return CreateUserResponseSchema.parse(data);
};

// Provisions a new account. The 201 carries the one-time temporary password; the
// page surfaces it once. The list is invalidated so the new row appears.
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.users });
    },
  });
};

export interface UpdateUserInput {
  id: string;
  displayName: string;
  payPalHandle?: string;
  role: RoleNumber;
  isActive: boolean;
}

const updateUser = async ({ id, ...body }: UpdateUserInput): Promise<AdminUser> => {
  const data = await apiClient.put(`/api/admin/users/${id}`, { ...body });
  return UpdateUserResponseSchema.parse(data).user;
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.users });
    },
  });
};

// Soft-deactivation (DELETE). The backend 409s when this would remove the last
// active admin; the caller maps that to a German message.
const deactivateUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/admin/users/${id}`);
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.users });
    },
  });
};

const resetPassword = async (id: string): Promise<ResetPasswordResponse> => {
  const data = await apiClient.post(`/api/admin/users/${id}/reset-password`);
  return ResetPasswordResponseSchema.parse(data);
};

// Issues a fresh one-time password (forces a change on next login). Does not
// alter the list shape, but `mustChangePassword` flips server-side, so the list
// is invalidated to reflect the new indicator.
export const useResetPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.users });
    },
  });
};

// --- Menu administration (C3) ---

const fetchMenu = async (signal: AbortSignal): Promise<AdminMenuItem[]> => {
  const data = await apiClient.get("/api/admin/menu", signal);
  return AdminMenuResponseSchema.parse(data).items;
};

// Lists all menu items including retired (soft-deleted) ones so the admin can
// see and re-enable them.
export const useAdminMenu = () =>
  useQuery({
    queryKey: adminKeys.menu,
    queryFn: ({ signal }) => fetchMenu(signal),
    staleTime: 30 * 1000,
  });

// The mutation payload. `id` is optional on create (slugified server-side when
// omitted) and carried separately on update (in the path, not the body).
export interface MenuItemBody {
  name: string;
  defaultPriceCents: number;
  kind: MenuKind;
  materialIcon: string;
  note?: string;
  isInsider: boolean;
  sortOrder: number;
  isAvailable: boolean;
}

export interface CreateMenuItemInput extends MenuItemBody {
  id?: string;
}

const createMenuItem = async (input: CreateMenuItemInput): Promise<AdminMenuItem> => {
  const data = await apiClient.post("/api/admin/menu", { ...input });
  return MenuItemResponseSchema.parse(data).item;
};

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMenuItem,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.menu });
    },
  });
};

export interface UpdateMenuItemInput extends MenuItemBody {
  id: string;
}

const updateMenuItem = async ({ id, ...body }: UpdateMenuItemInput): Promise<AdminMenuItem> => {
  const data = await apiClient.put(`/api/admin/menu/${id}`, { ...body });
  return MenuItemResponseSchema.parse(data).item;
};

export const useUpdateMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMenuItem,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.menu });
    },
  });
};

// DELETE: the backend hard-deletes an unreferenced item, else soft-retires it
// (so past orders keep their reference). Either way the list is invalidated.
const deleteMenuItem = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/admin/menu/${id}`);
};

export const useDeleteMenuItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMenuItem,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.menu });
    },
  });
};

// --- Döner-Tiere (C4, read-only) ---

const fetchTiere = async (signal: AbortSignal): Promise<AdminTiere> => {
  const data = await apiClient.get("/api/admin/tiere", signal);
  return AdminTiereResponseSchema.parse(data);
};

// The 15 tier definitions and their German trigger conditions, plus the
// `windowDays` basis. Read-only; the tiers are computed and seeded server-side,
// so there is nothing to mutate here.
export const useAdminTiere = () =>
  useQuery({
    queryKey: adminKeys.tiere,
    queryFn: ({ signal }) => fetchTiere(signal),
    staleTime: 5 * 60 * 1000,
  });

// --- Notification templates (open-day push texts) ---

const fetchNotificationTemplates = async (
  signal: AbortSignal,
): Promise<AdminNotificationTemplate[]> => {
  const data = await apiClient.get("/api/admin/notification-templates", signal);
  return AdminNotificationTemplatesResponseSchema.parse(data).items;
};

// Lists every open-day notification text, including disabled ones, so the admin can re-enable them.
export const useAdminNotificationTemplates = () =>
  useQuery({
    queryKey: adminKeys.notificationTemplates,
    queryFn: ({ signal }) => fetchNotificationTemplates(signal),
    staleTime: 30 * 1000,
  });

// The mutation payload. `id` is carried separately on update (in the path, not the body).
export interface NotificationTemplateBody {
  synonym: string;
  body: string;
  isActive: boolean;
}

const createNotificationTemplate = async (
  input: NotificationTemplateBody,
): Promise<AdminNotificationTemplate> => {
  const data = await apiClient.post("/api/admin/notification-templates", { ...input });
  return NotificationTemplateResponseSchema.parse(data).item;
};

export const useCreateNotificationTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNotificationTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.notificationTemplates });
    },
  });
};

export interface UpdateNotificationTemplateInput extends NotificationTemplateBody {
  id: string;
}

const updateNotificationTemplate = async ({
  id,
  ...body
}: UpdateNotificationTemplateInput): Promise<AdminNotificationTemplate> => {
  const data = await apiClient.put(`/api/admin/notification-templates/${id}`, { ...body });
  return NotificationTemplateResponseSchema.parse(data).item;
};

export const useUpdateNotificationTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateNotificationTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.notificationTemplates });
    },
  });
};

// DELETE hard-deletes the text (the body is copied onto each day, never FK-referenced).
const deleteNotificationTemplate = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/admin/notification-templates/${id}`);
};

export const useDeleteNotificationTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNotificationTemplate,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.notificationTemplates });
    },
  });
};

// --- Pizza variants (admin-managed order vocabulary) ---

const fetchPizzaVariants = async (signal: AbortSignal): Promise<AdminPizzaVariant[]> => {
  const data = await apiClient.get("/api/admin/pizza-variants", signal);
  return AdminPizzaVariantsResponseSchema.parse(data).items;
};

// Lists every pizza variant including unavailable ones, so the admin can see and re-enable them.
export const useAdminPizzaVariants = () =>
  useQuery({
    queryKey: adminKeys.pizzaVariants,
    queryFn: ({ signal }) => fetchPizzaVariants(signal),
    staleTime: 30 * 1000,
  });

// The mutation payload. `icon` is optional (omitted when no symbol is chosen); `id` is carried
// separately on update (in the path, not the body).
export interface PizzaVariantBody {
  name: string;
  icon?: string;
  sortOrder: number;
  isAvailable: boolean;
}

const createPizzaVariant = async (input: PizzaVariantBody): Promise<AdminPizzaVariant> => {
  const data = await apiClient.post("/api/admin/pizza-variants", { ...input });
  return PizzaVariantResponseSchema.parse(data).item;
};

// On success invalidates the admin list and the public order menu so the new variant appears on the
// order form without a reload.
export const useCreatePizzaVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPizzaVariant,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.pizzaVariants });
      void queryClient.invalidateQueries({ queryKey: orderMenuKey });
    },
  });
};

export interface UpdatePizzaVariantInput extends PizzaVariantBody {
  id: string;
}

const updatePizzaVariant = async ({
  id,
  ...body
}: UpdatePizzaVariantInput): Promise<AdminPizzaVariant> => {
  const data = await apiClient.put(`/api/admin/pizza-variants/${id}`, { ...body });
  return PizzaVariantResponseSchema.parse(data).item;
};

export const useUpdatePizzaVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePizzaVariant,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.pizzaVariants });
      void queryClient.invalidateQueries({ queryKey: orderMenuKey });
    },
  });
};

// DELETE: the backend hard-deletes an unreferenced variant, else soft-retires it (so past orders
// keep their reference). Either way the admin list and the order menu are invalidated.
const deletePizzaVariant = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/admin/pizza-variants/${id}`);
};

export const useDeletePizzaVariant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePizzaVariant,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.pizzaVariants });
      void queryClient.invalidateQueries({ queryKey: orderMenuKey });
    },
  });
};

// --- Registration mode (self-registration policy) ---

const fetchRegistrationMode = async (signal: AbortSignal): Promise<AdminRegistrationMode> => {
  const data = await apiClient.get("/api/admin/registration-mode", signal);
  return AdminRegistrationModeResponseSchema.parse(data);
};

// The current self-registration policy and the configured secret key. Short staleTime since an
// admin may toggle it and expect the screen to reflect the change on revisit.
export const useAdminRegistrationMode = () =>
  useQuery({
    queryKey: adminKeys.registrationMode,
    queryFn: ({ signal }) => fetchRegistrationMode(signal),
    staleTime: 30 * 1000,
  });

export interface UpdateRegistrationModeInput {
  mode: RegistrationModeNumber;
  /** Only sent for SecretKeyOnly; omitted for Enabled / Disabled. */
  secretKey?: string;
}

const updateRegistrationMode = async (
  input: UpdateRegistrationModeInput,
): Promise<AdminRegistrationMode> => {
  const body =
    input.secretKey !== undefined
      ? { mode: input.mode, secretKey: input.secretKey }
      : { mode: input.mode };
  const data = await apiClient.put("/api/admin/registration-mode", body);
  return AdminRegistrationModeResponseSchema.parse(data);
};

// Persists the policy. On success it invalidates both its own query and the pwa-gate client config
// so the login/register screens pick up the new mode without a reload.
export const useUpdateAdminRegistrationMode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRegistrationMode,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.registrationMode });
      void queryClient.invalidateQueries({ queryKey: clientConfigKey });
    },
  });
};
