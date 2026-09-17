import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { AdminOnly } from '../auth/admin.decorator';
import { ParseIdPipe } from '../common/pipes/parse-id.pipe';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

@Controller('admin/orders')
@AdminOnly()
export class AdminOrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  findAll(@Query() query: QueryOrdersDto) {
    return this.orders.findAll(query);
  }

  @Get('stats')
  stats() {
    return this.orders.countByStatus();
  }

  @Get(':id')
  findOne(@Param('id', ParseIdPipe) id: number) {
    return this.orders.findById(id);
  }

  @Patch(':id')
  updateStatus(
    @Param('id', ParseIdPipe) id: number,
    @Body() { status }: UpdateOrderStatusDto,
  ) {
    return this.orders.updateStatus(id, status);
  }
}
