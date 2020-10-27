import mongoose from 'mongoose';

export interface Repository {
  owner: string;
  name: string;
  title: string;
  issuesCount?: number | null;
  issuesAvgTime?: string | null;
  issuesTimeStdDev?: string | null;
  viewsCount: number;
}

export type RepositoryDocument = Repository & mongoose.Document;

const schema = new mongoose.Schema({
  owner: { type: String, required: true },
  name: { type: String, required: true },
  title: { type: String, required: true },
  issuesCount: { type: Number },
  issuesAvgTime: { type: String },
  issuesTimeStdDev: { type: String },
  viewsCount: { type: Number, required: true, select: false },
});

schema.index({ owner: 1, name: 1 }, { unique: true });

schema.set('toJSON', {
  getters: true,
  transform: (document: RepositoryDocument) => ({
    owner: document.owner,
    name: document.name,
    title: document.title,
    issuesCount: document.issuesCount,
    issuesAvgTime: document.issuesAvgTime,
    issuesTimeStdDev: document.issuesTimeStdDev,
  }),
});

export const RepositoryModel = mongoose.model<
  RepositoryDocument,
  mongoose.Model<RepositoryDocument>
>('Repository', schema);
