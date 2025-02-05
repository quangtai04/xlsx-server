import { Injectable } from '@nestjs/common';
import { DATA_BODY, DATA_SCRIPTS } from './scripts.controller';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import { isNullOrUndefined, isNumber, isString } from 'util';

export enum TASK_TYPE {
  UPDATING = 'updating',
  DONE = 'done',
}

enum SHEET_NAME {
  SL_GV_TA = 'Số lượng GVTA',
  SO_TRUONG_LOP_PT = 'Số trường, lớp phổ thông',
  SO_TRUONG_LOP_MAM_NON = 'Số trường, lớp mầm non',
  SO_LOP_HS = 'Số lớp, học sinh',
  SL_TRUNG_TAM_NGOAI_NGU = 'Số lượng trung tâm ngoại ngữ',
  FOXZ = 'foxz',
}

const RANGE: {
  [key in SHEET_NAME]: {
    start: INDEX_ROW;
    end: INDEX_ROW;
  };
} = {
  [SHEET_NAME.SL_GV_TA]: {
    start: {
      row: 5,
      column: 'D',
    },
    end: {
      row: 100,
      column: 'Z',
    },
  },
  [SHEET_NAME.SO_TRUONG_LOP_PT]: {
    start: {
      row: 5,
      column: 'D',
    },
    end: {
      row: 100,
      column: 'Z',
    },
  },
  [SHEET_NAME.SO_TRUONG_LOP_MAM_NON]: {
    start: {
      row: 1,
      column: 'B',
    },
    end: {
      row: 100,
      column: 'Z',
    },
  },
  [SHEET_NAME.SO_LOP_HS]: {
    start: {
      row: 5,
      column: 'D',
    },
    end: {
      row: 100,
      column: 'Z',
    },
  },
  [SHEET_NAME.SL_TRUNG_TAM_NGOAI_NGU]: {
    start: {
      row: 5,
      column: 'C',
    },
    end: {
      row: 100,
      column: 'Z',
    },
  },
  [SHEET_NAME.FOXZ]: {
    start: {
      row: 1,
      column: 'A',
    },
    end: {
      row: 100,
      column: 'Z',
    },
  },
};

enum TYPE_FILE {
  THPT = 'THPT',
  PGD = 'PGD',
  TEMPLATE = 'TEMPLATE',
}
interface INDEX_ROW {
  row: number;
  column: string;
}

@Injectable()
export class ScriptsService {
  constructor() {}

  async handle(data: DATA_BODY): Promise<DATA_SCRIPTS> {
    const files = await this._getFiles(data.path_folder);
    const promises: Promise<void>[] = [];
    const sheet_name_list: {
      [key: string]: string[];
    } = {};
    const workbook_pdt: XLSX.WorkBook = XLSX.readFile(data.path_pdt);
    const workbook_thpt: XLSX.WorkBook = XLSX.readFile(data.path_thpt);
    files.forEach((file) => {
      promises.push(
        new Promise(async (resolve) => {
          await this._handle_xlsx(
            file,
            {
              pdt: workbook_pdt,
              thpt: workbook_thpt,
            },
            {
              path_result: data.path_result,
              path_error_data: data.path_error_data,
            },
          );
          //
          const workbook = XLSX.readFile(file);
          const sheet_name_list_current = workbook.SheetNames;
          sheet_name_list_current.forEach((sheet_name) => {
            if (isNullOrUndefined(sheet_name_list[sheet_name])) {
              sheet_name_list[sheet_name] = [];
            }
            sheet_name_list[sheet_name].push(file);
          });
          resolve();
        }),
      );
    });
    await Promise.all(promises);
    return Promise.resolve({
      message: 'success',
      sheet_name_list: sheet_name_list,
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
      } else if (!path.includes(TYPE_FILE.TEMPLATE)) {
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
    return `${path ? `${path}/` : ''}${name}`;
  }

  private async _handle_xlsx(
    path: string,
    workbook: {
      pdt: XLSX.WorkBook;
      thpt: XLSX.WorkBook;
    },
    config?: {
      path_result?: string;
      path_error_data?: string;
    },
  ): Promise<void> {
    const workbook_current = XLSX.readFile(path);
    const relavitve_path = path.split('/').slice(-2)?.[0];
    switch (relavitve_path) {
      case TYPE_FILE.THPT:
        await this._handle_workbook(workbook_current, workbook.thpt, {
          path: path,
          path_result: config?.path_result,
          file_name_result: 'THPT.xlsx',
        });
        break;
      case TYPE_FILE.PGD:
        await this._handle_workbook(workbook_current, workbook.pdt, {
          path: path,
          path_result: config?.path_result,
          file_name_result: 'PGD.xlsx',
        });
        break;
      case TYPE_FILE.TEMPLATE:
        break;
      default:
        console.log(path);
        break;
    }
    return Promise.resolve();
  }

  private async _handle_workbook(
    workbook: XLSX.WorkBook,
    workbook_result: XLSX.WorkBook,
    config?: {
      path?: string;
      path_result?: string;
      path_data_error?: string;
      file_name_result?: string;
    },
  ): Promise<void> {
    const sheet_name_list = workbook.SheetNames;
    const promises: Promise<void>[] = [];
    sheet_name_list.forEach(async (sheet_name) => {
      promises.push(
        new Promise(async (resolve) => {
          const worksheet = workbook.Sheets?.[sheet_name];
          const worksheet_thpt = workbook_result.Sheets?.[sheet_name];
          if (isNullOrUndefined(worksheet) || isNullOrUndefined(worksheet_thpt))
            resolve();
          const range = RANGE[sheet_name];
          if (
            isNullOrUndefined(range?.start) ||
            isNullOrUndefined(range?.end)
          ) {
            console.log(config?.path, sheet_name);
          }
          for (let row = range.start.row; row <= range.end.row; row++) {
            for (
              let column = range.start.column;
              column <= range.end.column;
              column = String.fromCharCode(column.charCodeAt(0) + 1)
            ) {
              const cell = worksheet?.[`${column}${row}`];
              const cell_thpt = worksheet_thpt?.[`${column}${row}`];
              if (isNumber(cell?.v) && isNumber(cell_thpt?.v)) {
                cell_thpt.v += cell.v;
                if (
                  !isNullOrUndefined(config?.path_data_error) &&
                  cell?.v !== parseInt(cell?.v)
                ) {
                  if (!fs.existsSync(config?.path_data_error)) {
                    await fs.writeFileSync(config?.path_data_error, '');
                  }
                  const error = await fs.readFileSync(
                    config?.path_data_error,
                    'utf8',
                  );
                  await fs.writeFileSync(
                    config?.path_data_error,
                    `${error}\nPATH: ${config?.path} - SHEET: ${sheet_name} - ROW: ${column}${row}`,
                  );
                }
              }
            }
          }
          if (config?.path_result && !fs.existsSync(config?.path_result)) {
            await fs.mkdirSync(config?.path_result);
          }
          await XLSX.writeFile(
            workbook_result,
            this._getPathFile(config?.path_result, config?.file_name_result),
          );
          resolve();
        }),
      );
    });
    return Promise.resolve();
  }
}
