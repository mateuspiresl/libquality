import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  owner: { type: String, required: true },
  name: { type: String, required: true },
  title: { type: String, required: true },
  issuesCount: { type: Number },
  issuesAvgTime: { type: String },
  issuesTimeStdDev: { type: String },
  viewsCount: { type: Number, required: true },
});

schema.index({ owner: 1, name: 1 }, { unique: true });

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

export const RepositoryModel = mongoose.model<
  RepositoryDocument,
  mongoose.Model<RepositoryDocument>
>('Repository', schema);
