import { Body, Controller, Post } from '@nestjs/common';
import { CreateResponse, ResponseData } from 'src/global/globalClass';
import { ScriptsService } from './scripts.service';

export interface DATA_SCRIPTS {
  [key: string]: any;
  message: string;
}

export interface DATA_BODY {
  path_folder: string;
  path_pdt: string;
  path_thpt: string;
  path_result: string;
}
@Controller('scripts')
export class ScriptsController {
  constructor(private readonly scriptsServer: ScriptsService) {}

  @Post('/handle')
  updateHrm(
    @Body()
    data: DATA_BODY,
  ): Promise<ResponseData<DATA_SCRIPTS>> {
    return CreateResponse(this.scriptsServer.handle(data));
  }
}
