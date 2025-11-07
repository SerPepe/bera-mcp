import simpleGit, { SimpleGit } from 'simple-git';
import { promises as fs } from 'fs';
import path from 'path';
import { Config } from './config.js';

export interface RepoInfo {
  path: string;
  url: string;
  name: string;
}

export class DocumentDownloader {
  private git: SimpleGit;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.git = simpleGit();
  }

  async ensureRepo(repoInfo: RepoInfo): Promise<string> {
    const repoPath = repoInfo.path;
    const repoDir = path.dirname(repoPath);
    const repoName = path.basename(repoPath);

    try {
      await fs.mkdir(repoDir, { recursive: true });
    } catch (error) {
    }

    const gitDir = path.join(repoPath, '.git');
    let repoExists = false;
    try {
      await fs.access(gitDir);
      repoExists = true;
    } catch {
      repoExists = false;
    }

    if (repoExists) {
      console.log(`Updating existing repository: ${repoName}`);
      const repoGit = simpleGit(repoPath);
      await repoGit.pull();
    } else {
      console.log(`Cloning repository: ${repoName} from ${repoInfo.url}`);
      await this.git.clone(repoInfo.url, repoPath);
    }

    return repoPath;
  }

  async downloadAll(): Promise<{ docs: string; guides: string }> {
    console.log('Downloading Berachain documentation repositories...');

    const docsPath = await this.ensureRepo({
      path: this.config.repos.docs.path,
      url: this.config.repos.docs.url,
      name: 'docs',
    });

    const guidesPath = await this.ensureRepo({
      path: this.config.repos.guides.path,
      url: this.config.repos.guides.url,
      name: 'guides',
    });

    console.log('Repositories downloaded successfully');
    return {
      docs: docsPath,
      guides: guidesPath,
    };
  }

  async updateRepo(repoPath: string): Promise<void> {
    const repoGit = simpleGit(repoPath);
    await repoGit.pull();
  }
}

