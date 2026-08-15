/** The signed-in person. One source of truth so the rail avatar, the account
 *  popover and the sidebar footer can never drift apart. */
export const USER = {
  /** Stable key for anything stored per user — threads, pins, task state. */
  id: 'deepak',
  name: 'Deepak',
  role: 'Admin',
  org: 'HP',
  /** Shown inside the avatar circle. */
  initials: 'D',
} as const
