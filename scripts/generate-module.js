#!/usr/bin/env node
'use strict';

/**
 * Generador de modulos (Fase 8 del EAF).
 *
 * A partir de un nombre de entidad, toma las plantillas de `.claude/templates/`
 * (Fase 3), sustituye los placeholders documentados en
 * `.claude/templates/README.md` ({{PascalCase}}, {{camelCase}}, {{kebab-case}},
 * {{snake_case}}, {{PLURAL_kebab-case}}) y escribe los archivos del modulo
 * (entity, dto, repository, service, controller, migration, tests, pagina
 * frontend) en las carpetas del proyecto.
 *
 * Uso:
 *   node scripts/generate-module.js <NombreEntidad> [opciones]
 *
 * Opciones:
 *   --plural=<kebab-case>   Plural irregular (ej. --plural=inventories).
 *                           Por defecto se pluraliza de forma simple (+s / +es).
 *   --root=<ruta>           Raiz del proyecto (por defecto: raiz del repo EAF).
 *   --skip=<lista>          Partes a omitir, separadas por coma. Valores validos:
 *                           entity,dto,repository,service,controller,migration,
 *                           unit-test,integration-test,frontend
 *
 * Alcance real de esta Fase 8 (sin fabricar lo que no existe todavia):
 *   - Genera: Entity, DTO, Repository, Service, Controller, Migration,
 *     Unit Test, Integration Test, pagina Frontend basica.
 *   - Swagger: no genera un bootstrap nuevo por modulo (es global, una vez por
 *     app: `.claude/templates/swagger.bootstrap.template.ts`); el controller
 *     generado ya incluye los decoradores @Api* necesarios.
 *   - Electron: no aplica por modulo (main/preload son globales de la app de
 *     escritorio); usar las plantillas electron.* directamente si el proyecto
 *     tiene capa desktop.
 *   - Logs: ya incluidos en el Service generado (Logger de Nest, sin datos
 *     sensibles).
 *   - Auditoria: created_by/updated_by/deleted_at ya vienen en Entity y
 *     Migration. Un log de auditoria centralizado (tabla de eventos) NO tiene
 *     plantilla propia todavia — no se genera para no inventar una estructura
 *     sin validar.
 *   - Permisos: el Controller ya aplica AuthGuard. Verificacion de permisos
 *     granulares por rol depende de `roles.checklist.md` / `permissions.checklist.md`
 *     (Fase 6); esta version del generador no crea un guard de permisos propio.
 */

const fs = require('fs');
const path = require('path');

function fail(message) {
  process.stderr.write(`\n[generate-module] ERROR: ${message}\n\n`);
  process.exit(1);
}

function parseArgs(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(
      'Uso: node scripts/generate-module.js <NombreEntidad> [--plural=<kebab>] [--root=<ruta>] [--skip=parte1,parte2]\n' +
      'Ejemplo: node scripts/generate-module.js Equipment\n',
    );
    process.exit(0);
  }
  const positional = [];
  const options = { skip: [] };
  for (const arg of argv) {
    if (arg.startsWith('--plural=')) {
      options.plural = arg.slice('--plural='.length);
    } else if (arg.startsWith('--root=')) {
      options.root = arg.slice('--root='.length);
    } else if (arg.startsWith('--skip=')) {
      options.skip = arg
        .slice('--skip='.length)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (arg.startsWith('--')) {
      fail(`Opcion desconocida: ${arg}`);
    } else {
      positional.push(arg);
    }
  }
  return { positional, options };
}

function toPascalCase(input) {
  const spaced = input
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim();
  if (!spaced) fail('El nombre de la entidad no puede estar vacio.');
  return spaced
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function toCamelCase(pascal) {
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function toKebabCase(pascal) {
  return pascal.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function toSnakeCase(pascal) {
  return pascal.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

/**
 * Pluralizacion simple (reglas basicas de ingles, que es el idioma del codigo
 * fuente). No cubre plurales irregulares (ej. "company" -> "companies",
 * "inventory" -> "inventories") a proposito: para esos casos se debe pasar
 * `--plural=` explicitamente en vez de adivinar y arriesgar un nombre de ruta
 * incorrecto.
 */
function naivePlural(kebab) {
  if (/(s|x|z|ch|sh)$/.test(kebab)) return `${kebab}es`;
  return `${kebab}s`;
}

function buildCaseSet(rawName, pluralOverride) {
  const pascal = toPascalCase(rawName);
  const camel = toCamelCase(pascal);
  const kebab = toKebabCase(pascal);
  const snake = toSnakeCase(pascal);
  const plural = pluralOverride ? toKebabCase(toPascalCase(pluralOverride)) : naivePlural(kebab);
  return { pascal, camel, kebab, snake, plural };
}

function applyPlaceholders(content, cases) {
  return content
    .split('{{PLURAL_kebab-case}}').join(cases.plural)
    .split('{{PascalCase}}').join(cases.pascal)
    .split('{{camelCase}}').join(cases.camel)
    .split('{{kebab-case}}').join(cases.kebab)
    .split('{{snake_case}}').join(cases.snake);
}

function assertNoLeftoverPlaceholders(content, fileLabel) {
  const match = content.match(/{{[^}]*}}/);
  if (match) {
    fail(`Quedo un placeholder sin resolver (${match[0]}) en ${fileLabel}. No se escribe el archivo.`);
  }
}

function readTemplate(templatesDir, fileName) {
  const fullPath = path.join(templatesDir, fileName);
  if (!fs.existsSync(fullPath)) {
    fail(`No se encontro la plantilla "${fileName}" en ${templatesDir}. Verifica la Fase 3 antes de generar.`);
  }
  return fs.readFileSync(fullPath, 'utf8');
}

function writeGenerated(outPath, content, fileLabel) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, content, 'utf8');
  const roundTrip = fs.readFileSync(outPath, 'utf8');
  if (roundTrip !== content) {
    fail(`Verificacion de escritura fallo para ${fileLabel} (contenido en disco no coincide). Revisa permisos/ruta.`);
  }
  assertNoLeftoverPlaceholders(roundTrip, fileLabel);
  return outPath;
}

function main() {
  const { positional, options } = parseArgs(process.argv.slice(2));
  if (positional.length === 0) {
    process.stdout.write(
      'Uso: node scripts/generate-module.js <NombreEntidad> [--plural=<kebab>] [--root=<ruta>] [--skip=parte1,parte2]\n' +
      'Ejemplo: node scripts/generate-module.js Equipment\n'
    );
    process.exit(1);
  }
  const rawName = positional[0];
  const cases = buildCaseSet(rawName, options.plural);
  const skip = new Set(options.skip);

  const root = options.root ? path.resolve(options.root) : path.resolve(__dirname, '..');
  const templatesDir = path.join(root, '.claude', 'templates');
  const timestamp = Date.now();

  const generated = [];

  const moduleDir = path.join(root, 'backend', 'src', 'modules', cases.kebab);

  const plan = [
    {
      key: 'entity',
      template: 'entity.template.ts',
      out: path.join(moduleDir, `${cases.kebab}.entity.ts`),
    },
    {
      key: 'dto',
      template: 'dto.template.ts',
      out: path.join(moduleDir, `${cases.kebab}.dto.ts`),
    },
    {
      key: 'repository',
      template: 'repository.template.ts',
      out: path.join(moduleDir, `${cases.kebab}.repository.ts`),
    },
    {
      key: 'service',
      template: 'service.template.ts',
      out: path.join(moduleDir, `${cases.kebab}.service.ts`),
    },
    {
      key: 'controller',
      template: 'controller.template.ts',
      out: path.join(moduleDir, `${cases.kebab}.controller.ts`),
    },
    {
      key: 'migration',
      template: 'migration.template.ts',
      out: path.join(root, 'database', 'migrations', `${timestamp}-create-${cases.kebab}-table.ts`),
      postProcess: (content) => content.split('1700000000000').join(String(timestamp)),
    },
    {
      key: 'unit-test',
      template: 'unit-test.template.spec.ts',
      out: path.join(root, 'tests', cases.kebab, `${cases.kebab}.service.spec.ts`),
    },
    {
      key: 'integration-test',
      template: 'integration-test.template.spec.ts',
      out: path.join(root, 'tests', cases.kebab, `${cases.kebab}.e2e-spec.ts`),
    },
    {
      key: 'frontend',
      template: 'react-page.template.tsx',
      out: path.join(root, 'frontend', 'src', 'pages', cases.kebab, `${cases.kebab}-page.tsx`),
    },
  ];

  for (const item of plan) {
    if (skip.has(item.key)) {
      generated.push({ key: item.key, out: item.out, status: 'omitido (--skip)' });
      continue;
    }
    const raw = readTemplate(templatesDir, item.template);
    let content = applyPlaceholders(raw, cases);
    if (item.postProcess) content = item.postProcess(content);
    const finalPath = writeGenerated(item.out, content, `${item.key} (${item.out})`);
    generated.push({ key: item.key, out: finalPath, status: 'generado' });
  }

  process.stdout.write('\n[generate-module] Modulo generado\n');
  process.stdout.write(`  Entidad:      ${cases.pascal}\n`);
  process.stdout.write(`  camelCase:    ${cases.camel}\n`);
  process.stdout.write(`  kebab-case:   ${cases.kebab}\n`);
  process.stdout.write(`  snake_case:   ${cases.snake}\n`);
  process.stdout.write(`  plural:       ${cases.plural}\n\n`);
  for (const g of generated) {
    process.stdout.write(`  [${g.status}] ${path.relative(root, g.out)}\n`);
  }
  process.stdout.write(
    '\nPendiente antes de dar el modulo por terminado:\n' +
    '  1. Ajustar los campos de dominio (entity/dto/migration solo traen "name" y "status" de ejemplo).\n' +
    '  2. Registrar el modulo en el AppModule / rutas del frontend.\n' +
    '  3. Correr `module.checklist.md` (Fase 6) antes de marcarlo completo.\n' +
    '  4. Swagger, Electron, auditoria centralizada y permisos granulares NO se generan aqui ' +
    '(ver comentario de alcance al inicio de este script); resolverlos con sus plantillas/checklists correspondientes.\n\n'
  );
}

main();
