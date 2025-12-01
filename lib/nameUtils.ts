/**
 * Name utilities for consistent name formatting across the application
 */

export const formatFullName = (firstName?: string, lastName?: string): string => {
  const first = firstName?.trim();
  const last = lastName?.trim();

  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;
  return 'Untitled';
};

export const formatDisplayName = (firstName?: string, lastName?: string, fallback: string = 'Untitled'): string => {
  const first = firstName?.trim();
  const last = lastName?.trim();

  if (first && last) return `${first} ${last}`;
  if (first) return first;
  if (last) return last;
  return fallback;
};