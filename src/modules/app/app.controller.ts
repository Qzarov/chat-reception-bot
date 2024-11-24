import { Controller, Get, HttpStatus, Res } from '@nestjs/common';

@Controller()
export class AppController {
  // constructor(private botService: BotService) {}

  @Get('ping')
  getBotDialog(@Res() res: any) {
    //this.botService.botMessage();
    res.status(HttpStatus.OK).send('PONG');
  }
}
