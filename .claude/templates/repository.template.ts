import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { {{PascalCase}} } from './{{kebab-case}}.entity';

/**
 * Repository Pattern: this is the ONLY place in the codebase allowed to
 * query the {{PascalCase}} table directly. Services must depend on this
 * class, never on the ORM repository directly.
 */
@Injectable()
export class {{PascalCase}}Repository {
  constructor(
    @InjectRepository({{PascalCase}})
    private readonly repo: Repository<{{PascalCase}}>,
  ) {}

  async findAll(page: number, pageSize: number): Promise<[{{PascalCase}}[], number]> {
    return this.repo.findAndCount({
      where: { deletedAt: IsNull() },
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<{{PascalCase}} | null> {
    return this.repo.findOne({ where: { id, deletedAt: IsNull() } });
  }

  async create(data: Partial<{{PascalCase}}>): Promise<{{PascalCase}}> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }

  async update(id: string, data: Partial<{{PascalCase}}>): Promise<{{PascalCase}} | null> {
    await this.repo.update({ id }, data);
    return this.findById(id);
  }

  /** Soft delete only. Never hard-delete production data. */
  async softDelete(id: string, deletedBy: string): Promise<void> {
    await this.repo.update({ id }, { deletedAt: new Date(), updatedBy: deletedBy });
  }
}
