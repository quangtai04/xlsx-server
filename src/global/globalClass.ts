export enum HTTP_STATUS {
  ERROR = 404,
  SUCCESS = 200,
}

export enum HTTP_MESSAGE {
  ERROR = 'Server Internal Error',
  SUCCESS = 'Server Success Response',
}

export class ResponseData<D> {
  data: Promise<D | D[]>;
  statusCode: number;
  message: string;
  constructor(data: Promise<D | D[]>, statusCode: number, message: string) {
    this.data = data;
    this.statusCode = statusCode;
    this.message = message;

    return this;
  }
}

export function CreateResponse<D>(data: Promise<D>): Promise<ResponseData<D>> {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await data;
      resolve(
        new ResponseData<D>(
          result as any,
          HTTP_STATUS.SUCCESS,
          HTTP_MESSAGE.SUCCESS,
        ),
      );
    } catch (error: any) {
      reject(
        new ResponseData<D>(
          null,
          HTTP_STATUS.ERROR,
          error.message ?? HTTP_MESSAGE.ERROR,
        ),
      );
    }
  });
}
