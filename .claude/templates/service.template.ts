import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { {{PascalCase}}Repository } from './{{kebab-case}}.repository';
import { Create{{PascalCase}}Dto, Update{{PascalCase}}Dto } from './{{kebab-case}}.dto';
import { {{PascalCase}} } from './{{kebab-case}}.entity';

/**
 * Business logic for {{PascalCase}}. Controllers must never contain logic;
 * they only call this service. Every failure is logged and thrown as a
 * meaningful, typed exception — never swallowed.
 */
@Injectable()
export class {{PascalCase}}Service {
  private readonly logger = new Logger({{PascalCase}}Service.name);

  constructor(
    private readonly repository: {{PascalCase}}Repository,
    private readonly dataSource: DataSource,
  ) {}

  async list(page = 1, pageSize = 20): Promise<{ items: {{PascalCase}}[]; total: number }> {
    const [items, total] = await this.repository.findAll(page, pageSize);
    return { items, total };
  }

  async getById(id: string): Promise<{{PascalCase}}> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`{{PascalCase}} ${id} not found`);
    }
    return entity;
  }

  async create(dto: Create{{PascalCase}}Dto, userId: string): Promise<{{PascalCase}}> {
    return this.dataSource.transaction(async () => {
      const created = await this.repository.create({ ...dto, createdBy: userId, updatedBy: userId });
      this.logger.log(`{{PascalCase}} created id=${created.id} by=${userId}`);
      return created;
    });
  }

  async update(id: string, dto: Update{{PascalCase}}Dto, userId: string): Promise<{{PascalCase}}> {
    await this.getById(id); // ensures it exists and is not soft-deleted
    const updated = await this.repository.update(id, { ...dto, updatedBy: userId });
    if (!updated) {
      throw new NotFoundException(`{{PascalCase}} ${id} not found`);
    }
    this.logger.log(`{{PascalCase}} updated id=${id} by=${userId}`);
    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.getById(id);
    await this.repository.softDelete(id, userId);
    this.logger.log(`{{PascalCase}} soft-deleted id=${id} by=${userId}`);
  }
}
