export const generateHabitKey = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '_')          // Replace spaces with underscores
    .replace(/-+/g, '_')           // Replace multiple dashes with single underscore
    .replace(/^_+|_+$/g, '');     // Trim leading/trailing underscores
};