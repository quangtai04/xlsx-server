import { Body, Controller, Post } from '@nestjs/common';
import { CreateResponse, ResponseData } from 'src/global/globalClass';
import { ScriptsService } from './scripts.service';

export interface DATA_SCRIPTS {
  [key: string]: any;
  message: string;
}
@Controller('scripts')
export class ScriptsController {
  constructor(private readonly scriptsServer: ScriptsService) {}

  @Post('/handle')
  updateHrm(
    @Body() data: { path_folder: string },
  ): Promise<ResponseData<DATA_SCRIPTS>> {
    return CreateResponse(this.scriptsServer.handle(data.path_folder));
  }
}
