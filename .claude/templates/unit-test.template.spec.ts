import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { {{PascalCase}}Service } from './{{kebab-case}}.service';
import { {{PascalCase}}Repository } from './{{kebab-case}}.repository';

describe('{{PascalCase}}Service', () => {
  let service: {{PascalCase}}Service;
  let repository: jest.Mocked<{{PascalCase}}Repository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        {{PascalCase}}Service,
        {
          provide: {{PascalCase}}Repository,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: { transaction: (fn: any) => fn() },
        },
      ],
    }).compile();

    service = module.get({{PascalCase}}Service);
    repository = module.get({{PascalCase}}Repository);
  });

  it('throws NotFoundException when the entity does not exist', async () => {
    repository.findById.mockResolvedValue(null);
    await expect(service.getById('missing-id')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the entity when it exists', async () => {
    const entity = { id: '1', name: 'Test' } as any;
    repository.findById.mockResolvedValue(entity);
    await expect(service.getById('1')).resolves.toEqual(entity);
  });

  it('creates an entity tagging createdBy/updatedBy with the acting user', async () => {
    const created = { id: '1', name: 'Test' } as any;
    repository.create.mockResolvedValue(created);
    const result = await service.create({ name: 'Test' } as any, 'user-1');
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ createdBy: 'user-1', updatedBy: 'user-1' }),
    );
    expect(result).toEqual(created);
  });

  it('soft-deletes instead of hard-deleting', async () => {
    repository.findById.mockResolvedValue({ id: '1' } as any);
    await service.remove('1', 'user-1');
    expect(repository.softDelete).toHaveBeenCalledWith('1', 'user-1');
  });
});
