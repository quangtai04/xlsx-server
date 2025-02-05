import { Injectable } from '@nestjs/common';
import { DATA_SCRIPTS } from './scripts.controller';
import * as XLSX from 'xlsx';
import * as fs from 'fs';

export enum TASK_TYPE {
  UPDATING = 'updating',
  DONE = 'done',
}
@Injectable()
export class ScriptsService {
  constructor() {}

  async handle(path_folder: string): Promise<DATA_SCRIPTS> {
    const files = await this._getFiles(path_folder);
    return Promise.resolve({
      message: 'success',
      files: files,
    });
  }

  private async _getFiles(path: string): Promise<string[]> {
    const files: string[] = [];
    const filesInFolder = fs.readdirSync(path);
    const promises: Promise<void>[] = [];
    filesInFolder.forEach((file) => {
      const path_file = this._getPathFile(path, file);
      const isFile = fs.statSync(this._getPathFile(path, file)).isFile();
      if (isFile) {
        files.push(path_file);
      } else {
        promises.push(
          new Promise(async (resolve) => {
            const filesInSubFolder = await this._getFiles(
              this._getPathFile(path, file),
            );
            files.push(...filesInSubFolder);
            resolve();
          }),
        );
      }
    });
    if (promises.length > 0) await Promise.all(promises);
    return files;
  }

  private _getPathFile(path: string, name: string): string {
    return `${path}/${name}`;
  }

  private _handle_xlsx(path: string): void {}
}
