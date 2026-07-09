#!/usr/bin/env node
'use strict';

/**
 * AI Architect — gate de diseno (Fase 10 del EAF).
 *
 * Verifica que un design doc (`.claude/templates/design-doc.template.md`
 * llenado, normalmente en `docs/design/<kebab>.design.md`) tenga las 7
 * secciones obligatorias presentes y con contenido real, no el texto de
 * relleno de la plantilla. Este es el gate de ENTRADA: se corre ANTES de
 * `generate-module.js` (Fase 8). El gate de SALIDA (post-codigo) sigue
 * siendo `review-module.js` (Fase 9) + `module.checklist.md` (Fase 6).
 *
 * Como detecta "no llenado": compara, seccion por seccion, el cuerpo del
 * documento del usuario contra el cuerpo de la misma seccion en la plantilla
 * canonica (`.claude/templates/design-doc.template.md`). Si son iguales
 * (ignorando espacios), la seccion no se toco -> bloqueante. Esto evita
 * heuristicas fragiles basadas en longitud de texto.
 *
 * Uso:
 *   node scripts/check-design.js <NombreModuloKebabCase> [--root=<ruta>]
 *   node scripts/check-design.js --file=<ruta-al-design-doc> [--template=<ruta-a-la-plantilla>]
 *
 * Exit code 1 si falta alguna seccion o quedo igual a la plantilla sin llenar.
 */

const fs = require('fs');
const path = require('path');

const REQUIRED_SECTIONS = [
  'Entidad y campos',
  'Reglas de negocio',
  'Roles y permisos',
  'Requisitos no funcionales',
  'Fuente de datos',
  'Clasificación de datos y compliance',
  'Fuera de alcance',
];

function parseArgs(argv) {
  if (argv.includes('--help') || argv.includes('-h')) {
    process.stdout.write(
      'Uso:\n' +
      '  node scripts/check-design.js <NombreModuloKebabCase> [--root=<ruta>]\n' +
      '  node scripts/check-design.js --file=<ruta-al-design-doc> [--template=<ruta>]\n',
    );
    process.exit(0);
  }
  const positional = [];
  const options = {};
  for (const arg of argv) {
    if (arg.startsWith('--root=')) options.root = arg.slice('--root='.length);
    else if (arg.startsWith('--file=')) options.file = arg.slice('--file='.length);
    else if (arg.startsWith('--template=')) options.template = arg.slice('--template='.length);
    else if (arg.startsWith('--')) {
      process.stderr.write(`[check-design] Opcion desconocida: ${arg}\n`);
      process.exit(1);
    } else positional.push(arg);
  }
  return { positional, options };
}

function toKebabCase(input) {
  const pascalish = input
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .trim();
  return pascalish.split(/\s+/).join('-').toLowerCase();
}

/**
 * Parsea el documento en secciones por encabezado H2 ("## Titulo").
 * Devuelve un mapa titulo -> cuerpo (texto entre este H2 y el siguiente).
 */
function splitSections(content) {
  const lines = content.split('\n');
  const sections = new Map();
  let currentTitle = null;
  let currentBody = [];
  for (const line of lines) {
    const match = line.match(/^##\s+(.*)\s*$/);
    if (match) {
      if (currentTitle !== null) {
        sections.set(currentTitle.trim(), currentBody.join('\n').trim());
      }
      currentTitle = match[1];
      currentBody = [];
    } else if (currentTitle !== null) {
      currentBody.push(line);
    }
  }
  if (currentTitle !== null) {
    sections.set(currentTitle.trim(), currentBody.join('\n').trim());
  }
  return sections;
}

function normalize(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function reviewDesignDoc(content, templateContent, label) {
  const sections = splitSections(content);
  const templateSections = splitSections(templateContent);
  const findings = [];

  for (const required of REQUIRED_SECTIONS) {
    if (!sections.has(required)) {
      findings.push(`falta la seccion "## ${required}"`);
      continue;
    }
    const body = sections.get(required);
    if (body.length === 0) {
      findings.push(`la seccion "## ${required}" esta vacia`);
      continue;
    }
    const templateBody = templateSections.get(required);
    if (templateBody !== undefined && normalize(body) === normalize(templateBody)) {
      findings.push(`la seccion "## ${required}" quedo identica a la plantilla — no se reemplazo por una respuesta real`);
    }
  }

  process.stdout.write(`\n[check-design] Revision de: ${label}\n\n`);
  if (findings.length === 0) {
    process.stdout.write(`Las ${REQUIRED_SECTIONS.length} secciones requeridas estan presentes y fueron modificadas respecto a la plantilla.\n`);
    process.stdout.write('Recordatorio: esto solo confirma que existen respuestas propias, no que sean correctas — eso sigue siendo criterio del AI Architect / humano revisando.\n\n');
    return 0;
  }

  for (const f of findings) {
    process.stdout.write(`[BLOQUEANTE] ${f}\n`);
  }
  process.stdout.write(`\nResumen: ${findings.length} seccion(es) sin completar. No se debe correr generate-module.js hasta resolver esto.\n\n`);
  return findings.length;
}

function main() {
  const { positional, options } = parseArgs(process.argv.slice(2));
  const root = options.root ? path.resolve(options.root) : path.resolve(__dirname, '..');

  let filePath;
  let label;
  if (options.file) {
    filePath = path.resolve(options.file);
    label = path.relative(root, filePath) || filePath;
  } else if (positional.length > 0) {
    const kebab = toKebabCase(positional[0]);
    filePath = path.join(root, 'docs', 'design', `${kebab}.design.md`);
    label = `docs/design/${kebab}.design.md`;
  } else {
    process.stdout.write(
      'Uso:\n' +
      '  node scripts/check-design.js <NombreModuloKebabCase> [--root=<ruta>]\n' +
      '  node scripts/check-design.js --file=<ruta-al-design-doc> [--template=<ruta>]\n',
    );
    process.exit(1);
  }

  const templatePath = options.template
    ? path.resolve(options.template)
    : path.join(root, '.claude', 'templates', 'design-doc.template.md');

  if (!fs.existsSync(filePath)) {
    process.stderr.write(
      `[check-design] No existe ${filePath}.\n` +
      'Crea el design doc a partir de `.claude/templates/design-doc.template.md` antes de generar codigo.\n',
    );
    process.exit(1);
  }
  if (!fs.existsSync(templatePath)) {
    process.stderr.write(`[check-design] No se encontro la plantilla canonica en ${templatePath}.\n`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const templateContent = fs.readFileSync(templatePath, 'utf8');
  const missing = reviewDesignDoc(content, templateContent, label);
  process.exit(missing > 0 ? 1 : 0);
}

main();
