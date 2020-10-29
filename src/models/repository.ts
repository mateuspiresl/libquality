import mongoose from 'mongoose';

export interface Repository {
  owner: string;
  name: string;
  title: string;
  issuesCount: number;
  issuesAvgTime?: string;
  issuesTimeStdDev?: string;
  viewsCount?: number;
  refreshedAt?: Date;
}

export interface RepositoryDocument extends Repository, mongoose.Document {
  viewsCount: number;
  refreshedAt: Date;
  isCalculatingIssuesStatistics: boolean;
}

const schema = new mongoose.Schema({
  owner: { type: String, required: true },
  name: { type: String, required: true },
  title: { type: String, required: true },
  issuesCount: { type: Number, required: true },
  issuesAvgTime: { type: String },
  issuesTimeStdDev: { type: String },
  viewsCount: { type: Number, required: true, default: 1 },
  refreshedAt: { type: Date, required: true, default: () => new Date() },
});

schema.index({ owner: 1, name: 1 }, { unique: true });

schema
  .virtual('isCalculatingIssuesStatistics')
  .get(function isCalculatingIssuesStatistics() {
    return !this.issuesAvgTime;
  });

schema.set('toJSON', {
  getters: true,
  transform: (document: RepositoryDocument) => ({
    owner: document.owner,
    name: document.name,
    title: document.title,
    issuesCount: document.issuesCount,
    issuesAvgTime: document.issuesAvgTime,
    issuesTimeStdDev: document.issuesTimeStdDev,
    isCalculatingIssuesStatistics: document.isCalculatingIssuesStatistics,
  }),
});

export const RepositoryModel = mongoose.model<
  RepositoryDocument,
  mongoose.Model<RepositoryDocument, Repository>
>('Repository', schema);
