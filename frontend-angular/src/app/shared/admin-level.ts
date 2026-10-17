export interface AdminLevelBadge {
  label: string;
  icon: string;
  colorClass: string;
}

/** Label shown in the boundary configuration popup. */
export function adminLevelLabel(level: number): string {
  switch (level) {
    case 2:
      return 'Country';
    case 4:
      return 'Region';
    case 6:
      return 'Department';
    case 8:
      return 'Municipality';
    default:
      return `Level ${level}`;
  }
}

/** Badge shown next to each boundary search result. */
export function adminLevelBadge(level: number): AdminLevelBadge {
  switch (level) {
    case 2:
      return {
        label: 'Country',
        icon: '🌍',
        colorClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
      };
    case 4:
      return {
        label: 'Region',
        icon: '🏛️',
        colorClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
      };
    case 6:
      return {
        label: 'Department',
        icon: '🏢',
        colorClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
      };
    case 8:
      return {
        label: 'City',
        icon: '🏙️',
        colorClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
      };
    default:
      return {
        label: `Level ${level}`,
        icon: '🗺️',
        colorClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      };
  }
}
