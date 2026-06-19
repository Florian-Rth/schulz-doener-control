import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  AdminMenuResponseSchema,
  AdminUsersResponseSchema,
  CreateUserResponseSchema,
  MenuItemResponseSchema,
  ResetPasswordResponseSchema,
  UpdateUserResponseSchema,
} from "./schemas";
import type {
  AdminMenuItem,
  AdminUser,
  CreateUserResponse,
  MenuKind,
  ResetPasswordResponse,
  RoleNumber,
} from "./types";

export const adminKeys = {
  users: ["admin", "users"] as const,
  menu: ["admin", "menu"] as const,
};

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
