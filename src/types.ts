export type Kind = 'task' | 'note' | 'bookmark' | 'reminder';

export type Item = {
  id: string;
  kind: Kind;
  title: string;
  details: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  completed: boolean;
  dueAt: string | null;
  url: string | null;
};

export type DashboardData = {
  version: 1;
  items: Item[];
};

export type Filter = 'all' | Kind;
