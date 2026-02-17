import { useMemo } from 'react';

export type AppRole = 'admin' | 'super_admin' | 'operations_manager' | 'finance_manager' | 'support_staff' | 'content_manager' | 'user';

export type Permission =
  | 'view_bookings'
  | 'cancel_booking'
  | 'process_refund'
  | 'verify_payments'
  | 'manage_trips'
  | 'manage_batches'
  | 'manage_seats'
  | 'manage_destinations'
  | 'manage_content'
  | 'view_financial_data'
  | 'view_analytics'
  | 'view_leads'
  | 'manage_leads'
  | 'view_reviews'
  | 'manage_reviews'
  | 'view_audit_logs'
  | 'manage_roles'
  | 'delete_booking'
  | 'force_delete_booking'
  | 'manage_operations';

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [
    'view_bookings', 'cancel_booking', 'process_refund', 'verify_payments',
    'manage_trips', 'manage_batches', 'manage_seats',
    'manage_destinations', 'manage_content',
    'view_financial_data', 'view_analytics',
    'view_leads', 'manage_leads',
    'view_reviews', 'manage_reviews',
    'view_audit_logs', 'manage_roles',
    'delete_booking', 'force_delete_booking',
    'manage_operations',
  ],
  admin: [
    'view_bookings', 'cancel_booking', 'process_refund', 'verify_payments',
    'manage_trips', 'manage_batches', 'manage_seats',
    'manage_destinations', 'manage_content',
    'view_financial_data', 'view_analytics',
    'view_leads', 'manage_leads',
    'view_reviews', 'manage_reviews',
    'view_audit_logs', 'manage_roles',
    'delete_booking',
    'manage_operations',
  ],
  operations_manager: [
    'view_bookings',
    'manage_trips', 'manage_batches', 'manage_seats',
    'manage_destinations',
    'view_analytics',
    'view_leads', 'manage_leads',
    'view_reviews',
    'manage_operations',
  ],
  finance_manager: [
    'view_bookings',
    'process_refund',
    'verify_payments',
    'view_financial_data',
    'view_analytics',
  ],
  support_staff: [
    'view_bookings',
    'view_leads',
    'view_reviews',
  ],
  content_manager: [
    'manage_destinations',
    'manage_content',
    'view_reviews',
    'manage_reviews',
  ],
};

export const usePermissions = (roles: AppRole[]) => {
  const permissions = useMemo(() => {
    const allPerms = new Set<Permission>();
    for (const role of roles) {
      const rolePerms = ROLE_PERMISSIONS[role];
      if (rolePerms) {
        rolePerms.forEach(p => allPerms.add(p));
      }
    }
    return allPerms;
  }, [roles]);

  const can = (permission: Permission): boolean => permissions.has(permission);

  const canAny = (...perms: Permission[]): boolean => perms.some(p => permissions.has(p));

  const isStaffRole = roles.some(r => r !== 'user' && ROLE_PERMISSIONS[r]);

  return { can, canAny, permissions, isStaffRole, roles };
};

export const getRoleLabel = (role: AppRole): string => {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    operations_manager: 'Operations Manager',
    finance_manager: 'Finance Manager',
    support_staff: 'Support Staff',
    content_manager: 'Content Manager',
    user: 'User',
  };
  return labels[role] || role;
};
