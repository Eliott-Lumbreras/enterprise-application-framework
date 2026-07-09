import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req,
  ParseUUIDPipe, DefaultValuePipe, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '../security/auth.guard';
import { {{PascalCase}}Service } from './{{kebab-case}}.service';
import { Create{{PascalCase}}Dto, Update{{PascalCase}}Dto } from './{{kebab-case}}.dto';

/**
 * REST endpoints for {{PascalCase}}. All input is validated via DTOs before
 * reaching the service. All endpoints require authentication.
 */
@ApiTags('{{kebab-case}}')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('{{PLURAL_kebab-case}}')
export class {{PascalCase}}Controller {
  constructor(private readonly service: {{PascalCase}}Service) {}

  @Get()
  @ApiOperation({ summary: 'List {{PLURAL_kebab-case}} (paginated)' })
  @ApiResponse({ status: 200, description: 'Paginated list returned' })
  list(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('pageSize', new DefaultValuePipe(20), ParseIntPipe) pageSize: number,
  ) {
    return this.service.list(page, pageSize);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one {{kebab-case}} by id' })
  @ApiResponse({ status: 200, description: '{{PascalCase}} found' })
  @ApiResponse({ status: 404, description: '{{PascalCase}} not found' })
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a {{kebab-case}}' })
  @ApiResponse({ status: 201, description: '{{PascalCase}} created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: Create{{PascalCase}}Dto, @Req() req: any) {
    return this.service.create(dto, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a {{kebab-case}}' })
  @ApiResponse({ status: 200, description: '{{PascalCase}} updated' })
  @ApiResponse({ status: 404, description: '{{PascalCase}} not found' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: Update{{PascalCase}}Dto, @Req() req: any) {
    return this.service.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete a {{kebab-case}}' })
  @ApiResponse({ status: 200, description: '{{PascalCase}} deleted' })
  @ApiResponse({ status: 404, description: '{{PascalCase}} not found' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return this.service.remove(id, req.user.id);
  }
}
