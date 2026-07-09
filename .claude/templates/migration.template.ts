import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Reversible migration for {{PascalCase}} ({{snake_case}} table).
 * Never edit this file after it has been applied to any shared environment —
 * create a new migration instead.
 */
export class Create{{PascalCase}}Table1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: '{{snake_case}}',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'name', type: 'varchar', length: '255', isNullable: false },
          { name: 'status', type: 'varchar', length: '50', isNullable: true },
          { name: 'created_at', type: 'timestamptz', default: 'now()' },
          { name: 'updated_at', type: 'timestamptz', default: 'now()' },
          { name: 'created_by', type: 'uuid', isNullable: true },
          { name: 'updated_by', type: 'uuid', isNullable: true },
          { name: 'deleted_at', type: 'timestamptz', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      '{{snake_case}}',
      new TableIndex({
        name: 'idx_{{snake_case}}_deleted_at',
        columnNames: ['deleted_at'],
      }),
    );

    await queryRunner.createIndex(
      '{{snake_case}}',
      new TableIndex({
        name: 'idx_{{snake_case}}_status',
        columnNames: ['status'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('{{snake_case}}');
  }
}
