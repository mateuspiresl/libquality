import mongoose from 'mongoose';

export interface Repository {
  owner: string;
  name: string;
  title: string;
  issuesCount: number;
  issuesAvgTime?: string | null;
  issuesTimeStdDev?: string | null;
  viewsCount: number;
  refreshedAt: Date;
}

export type RepositoryDocument = Repository & mongoose.Document;

const schema = new mongoose.Schema({
  owner: { type: String, required: true },
  name: { type: String, required: true },
  title: { type: String, required: true },
  issuesCount: { type: Number, required: true },
  issuesAvgTime: { type: String },
  issuesTimeStdDev: { type: String },
  viewsCount: { type: Number, required: true },
  refreshedAt: { type: Date, required: true },
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
