import { Controller, Get, Post, Delete, Param, Body, ParseIntPipe, HttpCode } from '@nestjs/common';
import { TradeService } from './trade.service';
import { Trade } from './trade.entity';

@Controller()
export class TradeController {
  constructor(private readonly tradeService: TradeService) {}

  @Get('trades')
  getPendingTrades(): Promise<Trade[]> {
    return this.tradeService.getPendingTrades();
  }

  @Get('users/:userId/trades')
  getUserTrades(@Param('userId', ParseIntPipe) userId: number): Promise<Trade[]> {
    return this.tradeService.getUserTrades(userId);
  }

  @Post('users/:userId/trades')
  createTrade(
    @Param('userId', ParseIntPipe) userId: number,
    @Body('offeredFigureName') offeredFigureName: string,
    @Body('requestedFigureName') requestedFigureName: string,
  ): Promise<Trade> {
    return this.tradeService.createTrade(userId, offeredFigureName, requestedFigureName);
  }

  @Post('users/:userId/trades/:tradeId/accept')
  acceptTrade(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('tradeId', ParseIntPipe) tradeId: number,
  ): Promise<Trade> {
    return this.tradeService.acceptTrade(userId, tradeId);
  }

  @Post('users/:userId/trades/:tradeId/cancel')
  cancelTrade(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('tradeId', ParseIntPipe) tradeId: number,
  ): Promise<Trade> {
    return this.tradeService.cancelTrade(userId, tradeId);
  }

  @Delete('users/:userId/trades/:tradeId')
  @HttpCode(204)
  deleteTrade(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('tradeId', ParseIntPipe) tradeId: number,
  ): Promise<void> {
    return this.tradeService.deleteTrade(userId, tradeId);
  }
}
