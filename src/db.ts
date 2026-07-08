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

export class NovelWriterDB extends Dexie {
  projects!: Table<Project>;
  chapters!: Table<Chapter>;
  inspirations!: Table<Inspiration>;

  constructor() {
    super('NovelWriterDB');
    this.version(1).stores({
      projects: 'id, title, createdAt, updatedAt',
      chapters: 'id, projectId, volumeId, status, order',
      inspirations: 'id, projectId, createdAt, isProcessed'
    });
  }
}

export const db = new NovelWriterDB();
