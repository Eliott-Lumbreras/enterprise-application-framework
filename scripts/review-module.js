#!/usr/bin/env node
'use strict';

/**
 * Code Reviewer automatico (Fase 9 del EAF).
 *
 * Revisa codigo generado (tipicamente por `scripts/generate-module.js`, Fase 8)
 * o cualquier archivo TypeScript del proyecto contra reglas deterministas
 * derivadas de `.claude/CLAUDE.md` y los 10 checklists de `.claude/checklists/`.
 *
 * No reemplaza el `module.checklist.md` (ese sigue siendo el gate humano final:
 * cosas como "rate limiting configurado" o "OWASP revisado" requieren criterio,
 * no un regex). Este script solo automatiza la parte SI verificable por texto:
 * secretos hardcodeados, TODOs, catch vacios, columnas de auditoria, balance de
 * Swagger, guard de autenticacion, validacion en DTOs, paginacion en listados.
 *
 * Uso:
 *   node scripts/review-module.js <NombreModuloKebabCase> [--root=<ruta>]
 *   node scripts/review-module.js --path=<archivo-o-carpeta> [--root=<ruta>]
 *
 * Exit code 1 si hay al menos un hallazgo BLOQUEANTE. 0 si solo hay
 * advertencias/informativos o todo paso.
 */

const fs = require('fs');
const path = require('path');

const SEVERITY = { BLOCK: 'BLOQUEANTE', WARN: 'ADVERTENCIA', INFO: 'INFORMATIVO' };

function parseArgs(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(
      'Uso:\n' +
      '  node scripts/review-module.js <NombreModuloKebabCase> [--root=<ruta>]\n' +
      '  node scripts/review-module.js --path=<archivo-o-carpeta> [--root=<ruta>]\n',
    );
    process.exit(0);
  }
  const positional = [];
  const options = {};
  for (const arg of argv) {
    if (arg.startsWith('--root=')) options.root = arg.slice('--root='.length);
    else if (arg.startsWith('--path=')) options.path = arg.slice('--path='.length);
    else if (arg.startsWith('--')) {
      process.stderr.write(`[review-module] Opcion desconocida: ${arg}\n`);
      process.exit(1);
    } else positional.push(arg);
  }
  return { positional, options };
}

function walk(dir, acc) {
  if (!fs.existsSync(dir)) return acc;
  const stat = fs.statSync(dir);
  if (stat.isFile()) {
    acc.push(dir);
    return acc;
  }
  for (const entry of fs.readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.git') continue;
    walk(path.join(dir, entry), acc);
  }
  return acc;
}

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function lineOf(content, index) {
  return content.slice(0, index).split('\n').length;
}

function findAllMatches(content, regex) {
  const results = [];
  const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  let m;
  while ((m = re.exec(content)) !== null) {
    results.push({ match: m[0], line: lineOf(content, m.index) });
    if (m.index === re.lastIndex) re.lastIndex++;
  }
  return results;
}

// --- Reglas a nivel de archivo (aplican a cualquier .ts/.tsx segun el filtro) ---

const FILE_RULES = [
  {
    id: 'core.no-todo',
    checklist: 'CLAUDE.md (Mission: "Never leave TODOs")',
    severity: SEVERITY.BLOCK,
    appliesTo: () => true,
    check(content) {
      return findAllMatches(content, /\bTODO\b/i).map(
        (m) => `TODO encontrado ("${m.match}") en linea ${m.line}`,
      );
    },
  },
  {
    id: 'security.no-hardcoded-secrets',
    checklist: 'security.checklist.md ("Ningun secreto... hardcodeado")',
    severity: SEVERITY.BLOCK,
    // Se excluyen archivos de test (*.spec.ts / *.e2e-spec.ts): es practica
    // estandar y aceptada tener tokens/credenciales FALSAS ahi para montar
    // dobles de prueba (ej. el propio integration-test.template.spec.ts de
    // este framework usa `authToken = 'test-jwt-token'` a proposito). Un
    // secreto real jamas deberia estar en un test contra un sistema real,
    // pero eso lo cubre el criterio humano de security.checklist.md, no este
    // regex — de lo contrario todo modulo generado fallaria por su propio
    // test de integracion.
    appliesTo: (filePath) => !/\.(spec|e2e-spec)\.tsx?$/.test(filePath),
    check(content) {
      const findings = [];
      const assign = /(password|passwd|pwd|secret|api[_-]?key|access[_-]?key|private[_-]?key|token)\s*[:=]\s*['"][^'"]{3,}['"]/gi;
      for (const m of findAllMatches(content, assign)) {
        findings.push(`posible secreto hardcodeado en linea ${m.line}: "${m.match}"`);
      }
      for (const m of findAllMatches(content, /:\/\/[^/\s:]+:[^/\s@]+@/)) {
        findings.push(`credenciales embebidas en una URL en linea ${m.line}`);
      }
      for (const m of findAllMatches(content, /-----BEGIN (RSA )?PRIVATE KEY-----/)) {
        findings.push(`bloque de llave privada embebido en linea ${m.line}`);
      }
      return findings;
    },
  },
  {
    id: 'error-handling.no-empty-catch',
    checklist: 'error-handling.checklist.md ("Ninguna excepcion se atrapa y se descarta en silencio")',
    severity: SEVERITY.BLOCK,
    appliesTo: () => true,
    check(content) {
      return findAllMatches(content, /catch\s*\([^)]*\)\s*\{\s*\}/).map(
        (m) => `catch vacio en linea ${m.line} (la excepcion se descarta sin loguear/relanzar)`,
      );
    },
  },
  {
    id: 'logging.no-console',
    checklist: 'logging.checklist.md ("Logging estructurado", no console.log suelto)',
    severity: SEVERITY.WARN,
    appliesTo: (filePath) => /[\\/](backend|frontend)[\\/]src[\\/]/.test(filePath),
    check(content) {
      return findAllMatches(content, /\bconsole\.(log|warn|error|info|debug)\s*\(/).map(
        (m) => `"${m.match}" en linea ${m.line} — usar el Logger estructurado en vez de console.*`,
      );
    },
  },
  {
    id: 'security.no-sql-concat',
    checklist: 'security.checklist.md ("Sin concatenacion de SQL con input del usuario")',
    severity: SEVERITY.BLOCK,
    appliesTo: () => true,
    check(content) {
      return findAllMatches(content, /\.query\s*\(\s*`[^`]*\$\{/).map(
        (m) => `interpolacion directa dentro de un template literal pasado a .query() en linea ${m.line} — usar consulta parametrizada`,
      );
    },
  },
  {
    id: 'validation.dto-has-decorators',
    checklist: 'validation.checklist.md ("Cada campo de entrada tiene una regla de validacion explicita")',
    severity: SEVERITY.BLOCK,
    appliesTo: (filePath) => /\.dto\.ts$/.test(filePath),
    check(content) {
      const hasImport = /from ['"]class-validator['"]/.test(content);
      const decoratorCount = findAllMatches(content, /@(Is[A-Z]\w*|MaxLength|MinLength|Matches)\s*\(/).length;
      if (!hasImport || decoratorCount === 0) {
        return ['no se encontraron decoradores de class-validator (ej. @IsString, @IsNotEmpty) en el DTO'];
      }
      return [];
    },
  },
  {
    id: 'roles.controller-has-guard',
    checklist: 'roles.checklist.md / permissions.checklist.md ("cada endpoint declara que rol puede acceder")',
    severity: SEVERITY.BLOCK,
    appliesTo: (filePath) => /\.controller\.ts$/.test(filePath),
    check(content) {
      if (!/@UseGuards\s*\(/.test(content)) {
        return ['el controller no tiene @UseGuards(...) — el modulo quedaria sin autenticacion/autorizacion'];
      }
      return [];
    },
  },
  {
    id: 'swagger.operation-balance',
    checklist: 'swagger.checklist.md ("Cada endpoint nuevo tiene @ApiOperation")',
    severity: SEVERITY.BLOCK,
    appliesTo: (filePath) => /\.controller\.ts$/.test(filePath),
    check(content) {
      const routes = findAllMatches(content, /@(Get|Post|Put|Patch|Delete)\s*\(/).length;
      const apiOps = findAllMatches(content, /@ApiOperation\s*\(/).length;
      if (routes > apiOps) {
        return [`${routes} endpoint(s) pero solo ${apiOps} @ApiOperation — hay endpoints sin documentar`];
      }
      return [];
    },
  },
  {
    id: 'audit.entity-columns',
    checklist: 'audit.checklist.md ("created_by/updated_by, created_at/updated_at, deleted_at")',
    severity: SEVERITY.BLOCK,
    appliesTo: (filePath) => /\.entity\.ts$/.test(filePath),
    check(content) {
      const required = ['createdAt', 'updatedAt', 'createdBy', 'updatedBy', 'deletedAt'];
      const missing = required.filter((col) => !content.includes(col));
      return missing.length ? [`faltan columnas de auditoria en la entidad: ${missing.join(', ')}`] : [];
    },
  },
  {
    id: 'audit.migration-columns',
    checklist: 'audit.checklist.md ("created_by/updated_by, created_at/updated_at, deleted_at")',
    severity: SEVERITY.BLOCK,
    appliesTo: (filePath) => /[\\/]migrations[\\/].*\.ts$/.test(filePath) && /createTable|MigrationInterface/.test(readFileSafe(filePath) || ''),
    check(content) {
      const required = ['created_at', 'updated_at', 'created_by', 'updated_by', 'deleted_at'];
      const missing = required.filter((col) => !content.includes(col));
      return missing.length ? [`faltan columnas de auditoria en la migracion: ${missing.join(', ')}`] : [];
    },
  },
  {
    id: 'performance.list-pagination',
    checklist: 'performance.checklist.md ("Toda lista expuesta por API esta paginada")',
    severity: SEVERITY.WARN,
    appliesTo: (filePath) => /\.repository\.ts$/.test(filePath),
    check(content) {
      const hasPageParams = /\bpage\b/.test(content) && /\bpageSize\b/.test(content);
      const hasSkipTake = /\bskip\b/.test(content) && /\btake\b/.test(content);
      if (!hasPageParams && !hasSkipTake) {
        return ['no se detecto paginacion (page/pageSize o skip/take) en el repository — confirmar que ningun metodo devuelve la tabla completa sin limite'];
      }
      return [];
    },
  },
];

// --- Reglas a nivel de modulo (requieren conocer el nombre kebab del modulo) ---

function moduleRules(root, kebab) {
  const findings = [];
  const testsDir = path.join(root, 'tests', kebab);
  const unitTest = path.join(testsDir, `${kebab}.service.spec.ts`);
  const e2eTest = path.join(testsDir, `${kebab}.e2e-spec.ts`);
  if (!fs.existsSync(unitTest)) {
    findings.push({
      id: 'testing.unit-test-exists',
      checklist: 'testing.checklist.md ("Tests unitarios de la logica de negocio")',
      severity: SEVERITY.BLOCK,
      message: `no existe ${path.relative(root, unitTest)}`,
    });
  }
  if (!fs.existsSync(e2eTest)) {
    findings.push({
      id: 'testing.integration-test-exists',
      checklist: 'testing.checklist.md ("Tests de integracion del Controller")',
      severity: SEVERITY.BLOCK,
      message: `no existe ${path.relative(root, e2eTest)}`,
    });
  }
  const migrationsDir = path.join(root, 'database', 'migrations');
  const hasMigration = fs.existsSync(migrationsDir) &&
    fs.readdirSync(migrationsDir).some((f) => f.includes(`create-${kebab}-table`));
  if (!hasMigration) {
    findings.push({
      id: 'database.migration-exists',
      checklist: 'CLAUDE.md (Database: "Always create... migrations")',
      severity: SEVERITY.BLOCK,
      message: `no se encontro una migracion "create-${kebab}-table" en ${path.relative(root, migrationsDir)}`,
    });
  }
  const frontendPage = path.join(root, 'frontend', 'src', 'pages', kebab, `${kebab}-page.tsx`);
  if (!fs.existsSync(frontendPage)) {
    findings.push({
      id: 'frontend.page-exists',
      checklist: 'informativo (no todo modulo necesita UI, ej. jobs de background)',
      severity: SEVERITY.INFO,
      message: `no se encontro pagina frontend en ${path.relative(root, frontendPage)}`,
    });
  }
  return findings;
}

function collectFilesForModule(root, kebab) {
  const candidates = [
    path.join(root, 'backend', 'src', 'modules', kebab),
    path.join(root, 'tests', kebab),
    path.join(root, 'frontend', 'src', 'pages', kebab),
  ];
  let files = [];
  for (const dir of candidates) files = files.concat(walk(dir, []));
  const migrationsDir = path.join(root, 'database', 'migrations');
  if (fs.existsSync(migrationsDir)) {
    files = files.concat(
      fs.readdirSync(migrationsDir)
        .filter((f) => f.includes(`create-${kebab}-table`))
        .map((f) => path.join(migrationsDir, f)),
    );
  }
  return files.filter((f) => /\.tsx?$/.test(f));
}

function reviewFiles(files) {
  const findings = [];
  for (const filePath of files) {
    const content = readFileSafe(filePath);
    if (content === null) continue;
    for (const rule of FILE_RULES) {
      if (!rule.appliesTo(filePath)) continue;
      const messages = rule.check(content, filePath);
      for (const message of messages) {
        findings.push({ id: rule.id, checklist: rule.checklist, severity: rule.severity, file: filePath, message });
      }
    }
  }
  return findings;
}

function printReport(findings, scopeLabel) {
  process.stdout.write(`\n[review-module] Revision de: ${scopeLabel}\n`);
  process.stdout.write(`Reglas evaluadas: ${FILE_RULES.length} a nivel de archivo (+ reglas de modulo si aplica)\n\n`);

  if (findings.length === 0) {
    process.stdout.write('Sin hallazgos. Nada que reportar con las reglas automatizables.\n');
  } else {
    const order = { [SEVERITY.BLOCK]: 0, [SEVERITY.WARN]: 1, [SEVERITY.INFO]: 2 };
    findings.sort((a, b) => order[a.severity] - order[b.severity]);
    for (const f of findings) {
      const where = f.file ? ` (${f.file})` : '';
      process.stdout.write(`[${f.severity}] ${f.id} — ${f.message}${where}\n`);
      process.stdout.write(`    checklist: ${f.checklist}\n`);
    }
  }

  const blocking = findings.filter((f) => f.severity === SEVERITY.BLOCK).length;
  const warnings = findings.filter((f) => f.severity === SEVERITY.WARN).length;
  const infos = findings.filter((f) => f.severity === SEVERITY.INFO).length;
  process.stdout.write(`\nResumen: ${blocking} bloqueante(s), ${warnings} advertencia(s), ${infos} informativo(s).\n`);
  process.stdout.write(
    'Este reporte cubre solo lo verificable por texto. Antes de marcar el modulo como terminado, ' +
    'sigue pasando `module.checklist.md` completo (incluye criterios que requieren revision humana: ' +
    'rate limiting, revision OWASP, N+1 reales, cache, etc.).\n\n',
  );
  return blocking;
}

function main() {
  const { positional, options } = parseArgs(process.argv.slice(2));
  const root = options.root ? path.resolve(options.root) : path.resolve(__dirname, '..');

  let files = [];
  let scopeLabel = '';
  let moduleFindings = [];

  if (options.path) {
    const target = path.resolve(options.path);
    files = walk(target, []).filter((f) => /\.tsx?$/.test(f));
    scopeLabel = path.relative(root, target) || target;
  } else if (positional.length > 0) {
    const kebab = positional[0];
    files = collectFilesForModule(root, kebab);
    moduleFindings = moduleRules(root, kebab);
    scopeLabel = `modulo "${kebab}"`;
  } else {
    process.stdout.write(
      'Uso:\n' +
      '  node scripts/review-module.js <NombreModuloKebabCase> [--root=<ruta>]\n' +
      '  node scripts/review-module.js --path=<archivo-o-carpeta> [--root=<ruta>]\n',
    );
    process.exit(1);
  }

  if (files.length === 0) {
    process.stderr.write(`[review-module] No se encontraron archivos .ts/.tsx para revisar en: ${scopeLabel}\n`);
    process.exit(1);
  }

  const fileFindings = reviewFiles(files);
  const blocking = printReport([...fileFindings, ...moduleFindings], scopeLabel);
  process.exit(blocking > 0 ? 1 : 0);
}

main();
