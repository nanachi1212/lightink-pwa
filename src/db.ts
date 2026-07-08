import Dexie, { type Table } from 'dexie';

export interface Project {
  id: string;
  title: string;
  cover?: string;
  createdAt: number;
  updatedAt: number;
  targetWordCount?: number;
}

export interface Chapter {
  id: string;
  projectId: string;
  volumeId?: string;
  title: string;
  content: string;
  summary: string;
  status: 'not_started' | 'draft' | 'reviewing' | 'finished' | 'abandoned';
  tags: string[];
  order: number;
  wordCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface Inspiration {
  id: string;
  projectId?: string;
  content: string;
  createdAt: number;
  isProcessed: boolean;
}

export interface Character {
  id: string;
  projectId: string;
  name: string;
  role: string;
  description: string;
  createdAt: number;
  updatedAt: number;
}

export class NovelWriterDB extends Dexie {
  projects!: Table<Project>;
  chapters!: Table<Chapter>;
  inspirations!: Table<Inspiration>;
  characters!: Table<Character>;

  constructor() {
    super('NovelWriterDB');
    this.version(2).stores({
      projects: 'id, title, createdAt, updatedAt',
      chapters: 'id, projectId, volumeId, status, order',
      inspirations: 'id, projectId, createdAt, isProcessed',
      characters: 'id, projectId, name, role'
    });
  }
}

export const db = new NovelWriterDB();
