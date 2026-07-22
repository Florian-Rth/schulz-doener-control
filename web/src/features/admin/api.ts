import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  AdminCategoriesResponseSchema,
  AdminFieldsResponseSchema,
  AdminMenuResponseSchema,
  AdminNotificationTemplatesResponseSchema,
  AdminRegistrationModeResponseSchema,
  AdminTiereResponseSchema,
  AdminUsersResponseSchema,
  CategoryResponseSchema,
  CreateUserResponseSchema,
  FieldResponseSchema,
  MenuItemResponseSchema,
  NotificationTemplateResponseSchema,
  ResetPasswordResponseSchema,
  UpdateUserResponseSchema,
} from "./schemas";
import type {
  AdminAnswers,
  AdminCategory,
  AdminField,
  AdminMenuItem,
  AdminNotificationTemplate,
  AdminRegistrationMode,
  AdminTiere,
  AdminUser,
  CategoryFieldLink,
  CreateUserResponse,
  FieldDisplay,
  FieldType,
  RegistrationModeNumber,
  ResetPasswordResponse,
  RoleNumber,
} from "./types";

export const adminKeys = {
  users: ["admin", "users"] as const,
  menu: ["admin", "menu"] as const,
  categories: ["admin", "categories"] as const,
  fields: ["admin", "fields"] as const,
  tiere: ["admin", "tiere"] as const,
  notificationTemplates: ["admin", "notification-templates"] as const,
  registrationMode: ["admin", "registration-mode"] as const,
};

// The pwa-gate feature's client-config query key. Duplicated here (rather than imported, since
// features never import other features) so updating the registration mode can invalidate the
// client config the login/register screens read, keeping that policy in sync without a reload.
const clientConfigKey = ["config", "client"] as const;

// The order feature's public menu query key (`orderKeys.menu`). Duplicated here (features never
// import other features) so a category / field / option mutation can invalidate the order form's
// menu vocabulary, surfacing added / edited / removed choices without a reload.
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
// `categoryKey` / `baseItemId` are null when unset; `defaultAnswers` is null when
// the item seeds no field answers.
export interface MenuItemBody {
  name: string;
  defaultPriceCents: number;
  categoryKey: string | null;
  baseItemId: string | null;
  materialIcon: string;
  note?: string;
  isInsider: boolean;
  sortOrder: number;
  isAvailable: boolean;
  defaultAnswers: AdminAnswers | null;
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

// --- Food categories (generic Store→Category→Field→Option engine) ---

const fetchCategories = async (signal: AbortSignal): Promise<AdminCategory[]> => {
  const data = await apiClient.get("/api/admin/categories", signal);
  return AdminCategoriesResponseSchema.parse(data).items;
};

// Lists every category including unavailable ones, so the admin can see and re-enable them.
export const useAdminCategories = () =>
  useQuery({
    queryKey: adminKeys.categories,
    queryFn: ({ signal }) => fetchCategories(signal),
    staleTime: 30 * 1000,
  });

// A mutation that changed the engine (category/field/option) invalidates both the admin list it
// belongs to and the public order menu so the order form picks up the change without a reload.
const invalidateCategories = (queryClient: ReturnType<typeof useQueryClient>): void => {
  void queryClient.invalidateQueries({ queryKey: adminKeys.categories });
  void queryClient.invalidateQueries({ queryKey: orderMenuKey });
};

const invalidateFields = (queryClient: ReturnType<typeof useQueryClient>): void => {
  void queryClient.invalidateQueries({ queryKey: adminKeys.fields });
  void queryClient.invalidateQueries({ queryKey: orderMenuKey });
};

// The category mutation payload. `key` is carried separately on update (in the path, not the body).
export interface CategoryBody {
  name: string;
  sortOrder: number;
  isAvailable: boolean;
}

export interface CreateCategoryInput extends CategoryBody {
  key: string;
}

const createCategory = async (input: CreateCategoryInput): Promise<AdminCategory> => {
  const data = await apiClient.post("/api/admin/categories", { ...input });
  return CategoryResponseSchema.parse(data).item;
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      invalidateCategories(queryClient);
    },
  });
};

export interface UpdateCategoryInput extends CategoryBody {
  key: string;
}

const updateCategory = async ({ key, ...body }: UpdateCategoryInput): Promise<AdminCategory> => {
  const data = await apiClient.put(`/api/admin/categories/${key}`, { ...body });
  return CategoryResponseSchema.parse(data).item;
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCategory,
    onSuccess: () => {
      invalidateCategories(queryClient);
    },
  });
};

// DELETE: 409 when a menu item still references the category; the caller maps that to German.
const deleteCategory = async (key: string): Promise<void> => {
  await apiClient.delete(`/api/admin/categories/${key}`);
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      invalidateCategories(queryClient);
    },
  });
};

export interface SetCategoryFieldsInput {
  key: string;
  fields: CategoryFieldLink[];
}

// Replaces the category's whole field-link set with the given ordered list.
const setCategoryFields = async ({
  key,
  fields,
}: SetCategoryFieldsInput): Promise<AdminCategory> => {
  const data = await apiClient.put(`/api/admin/categories/${key}/fields`, { fields });
  return CategoryResponseSchema.parse(data).item;
};

export const useSetCategoryFields = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setCategoryFields,
    onSuccess: () => {
      invalidateCategories(queryClient);
    },
  });
};

// --- Fields & options (the order vocabulary) ---

const fetchFields = async (signal: AbortSignal): Promise<AdminField[]> => {
  const data = await apiClient.get("/api/admin/fields", signal);
  return AdminFieldsResponseSchema.parse(data).items;
};

// Lists every field with its options, so the admin can edit the whole vocabulary in one place.
export const useAdminFields = () =>
  useQuery({
    queryKey: adminKeys.fields,
    queryFn: ({ signal }) => fetchFields(signal),
    staleTime: 30 * 1000,
  });

export interface CreateFieldInput {
  key: string;
  label: string;
  type: FieldType;
  display: FieldDisplay;
  maxLength: number | null;
}

const createField = async (input: CreateFieldInput): Promise<AdminField> => {
  const data = await apiClient.post("/api/admin/fields", { ...input });
  return FieldResponseSchema.parse(data).item;
};

export const useCreateField = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createField,
    onSuccess: () => {
      invalidateFields(queryClient);
    },
  });
};

// PUT: `key` and `type` are immutable, so only label / display / maxLength are sent.
export interface UpdateFieldInput {
  key: string;
  label: string;
  display: FieldDisplay;
  maxLength: number | null;
}

const updateField = async ({ key, ...body }: UpdateFieldInput): Promise<AdminField> => {
  const data = await apiClient.put(`/api/admin/fields/${key}`, { ...body });
  return FieldResponseSchema.parse(data).item;
};

export const useUpdateField = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateField,
    onSuccess: () => {
      invalidateFields(queryClient);
    },
  });
};

// DELETE: 400 when the field is a reserved meat/sauce, 409 when a category still references it.
const deleteField = async (key: string): Promise<void> => {
  await apiClient.delete(`/api/admin/fields/${key}`);
};

export const useDeleteField = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteField,
    onSuccess: () => {
      invalidateFields(queryClient);
    },
  });
};

// The option mutation payload. `icon` is null when no symbol is chosen; `key` is carried separately
// on update (in the path, not the body). Every option endpoint returns the whole affected field.
export interface FieldOptionBody {
  label: string;
  icon: string | null;
  priceDeltaCents: number;
  sortOrder: number;
  isAvailable: boolean;
}

export interface AddFieldOptionInput extends FieldOptionBody {
  fieldKey: string;
  key: string;
}

const addFieldOption = async ({ fieldKey, ...body }: AddFieldOptionInput): Promise<AdminField> => {
  const data = await apiClient.post(`/api/admin/fields/${fieldKey}/options`, { ...body });
  return FieldResponseSchema.parse(data).item;
};

export const useAddFieldOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addFieldOption,
    onSuccess: () => {
      invalidateFields(queryClient);
    },
  });
};

export interface UpdateFieldOptionInput extends FieldOptionBody {
  fieldKey: string;
  key: string;
}

const updateFieldOption = async ({
  fieldKey,
  key,
  ...body
}: UpdateFieldOptionInput): Promise<AdminField> => {
  const data = await apiClient.put(`/api/admin/fields/${fieldKey}/options/${key}`, { ...body });
  return FieldResponseSchema.parse(data).item;
};

export const useUpdateFieldOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateFieldOption,
    onSuccess: () => {
      invalidateFields(queryClient);
    },
  });
};

export interface DeleteFieldOptionInput {
  fieldKey: string;
  key: string;
}

// DELETE: soft-retire server-side; 400 when the option is reserved.
const deleteFieldOption = async ({ fieldKey, key }: DeleteFieldOptionInput): Promise<void> => {
  await apiClient.delete(`/api/admin/fields/${fieldKey}/options/${key}`);
};

export const useDeleteFieldOption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFieldOption,
    onSuccess: () => {
      invalidateFields(queryClient);
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
