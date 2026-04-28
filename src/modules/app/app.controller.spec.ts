import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();
  });

  describe('getBotDialog', () => {
    it('should return PONG', () => {
      const appController = app.get(AppController);
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      appController.getBotDialog(res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith('PONG');
    });
  });
});
