export class CodeGenerator {
  constructor(options = {}) {
    this.options = {
      recursive: true,
      strict: true,
      customTypes: {},
      customValidators: [],
      ...options,
    };
  }

  compile(schema) {
    const { customTypes, customValidators, recursive } = this.options;

    const code = [];
    code.push(`const errors = [];`);

    const gen = (schema, dataRef, pathExpr, depth = 0) => {
      if (schema === true) return;

      if (schema === false) {
        code.push(`
errors.push({
  path: ${pathExpr},
  message: "Schema is false, value is not allowed"
});
`);
        return;
      }

      if (!schema) return;

      if (schema.type) {
        const typeCheck = this.generateTypeCheck(schema.type, dataRef);
        const typeLabel = Array.isArray(schema.type)
          ? schema.type.join(', ')
          : schema.type;

        code.push(`
if (${typeCheck}) {
`);

        if (schema.enum) {
          const values = JSON.stringify(schema.enum);
          code.push(`
if (!${values}.includes(${dataRef})) {
  errors.push({
    path: ${pathExpr},
    message: "Value '" + ${dataRef} + "' is not one of: ${schema.enum.join(', ')}"
  });
}
`);
        }

        if (schema.minimum !== undefined) {
          code.push(`
if (${dataRef} < ${schema.minimum}) {
  errors.push({
    path: ${pathExpr},
    message: "Value " + ${dataRef} + " < minimum ${schema.minimum}"
  });
}
`);
        }

        if (schema.maximum !== undefined) {
          code.push(`
if (${dataRef} > ${schema.maximum}) {
  errors.push({
    path: ${pathExpr},
    message: "Value " + ${dataRef} + " > maximum ${schema.maximum}"
  });
}
`);
        }

        if (schema.exclusiveMinimum !== undefined) {
          code.push(`
if (${dataRef} <= ${schema.exclusiveMinimum}) {
  errors.push({
    path: ${pathExpr},
    message: "Value " + ${dataRef} + " <= exclusiveMinimum ${schema.exclusiveMinimum}"
  });
}
`);
        }

        if (schema.exclusiveMaximum !== undefined) {
          code.push(`
if (${dataRef} >= ${schema.exclusiveMaximum}) {
  errors.push({
    path: ${pathExpr},
    message: "Value " + ${dataRef} + " >= exclusiveMaximum ${schema.exclusiveMaximum}"
  });
}
`);
        }

        if (schema.multipleOf !== undefined) {
          code.push(`
if (${dataRef} % ${schema.multipleOf} !== 0) {
  errors.push({
    path: ${pathExpr},
    message: "Value " + ${dataRef} + " not multipleOf ${schema.multipleOf}"
  });
}
`);
        }

        if (recursive && schema.type === 'object') {
          code.push(`
if (${dataRef} && typeof ${dataRef} === 'object' && !Array.isArray(${dataRef})) {
`);
          if (schema.properties) {
            for (const key in schema.properties) {
              const prop = schema.properties[key];
              const ref = `${dataRef}.${key}`;

              const childPath =
                pathExpr === '""' ? `"${key}"` : `${pathExpr} + "." + "${key}"`;

              code.push(`
if (${dataRef}.${key} !== undefined) {
`);
              gen(prop, ref, childPath, depth);
              code.push(`}`);
            }
          }

          if (schema.additionalProperties === false && schema.properties) {
            const keys = JSON.stringify(Object.keys(schema.properties));

            code.push(`
for (const k in ${dataRef}) {
  if (!${keys}.includes(k)) {
    errors.push({
      path: k,
      message: "Unexpected field '" + k + "'"
    });
  }
}
`);
          }

          if (typeof schema.additionalProperties === 'object') {
            code.push(`
for (const k in ${dataRef}) {
`);
            if (schema.properties) {
              const keys = JSON.stringify(Object.keys(schema.properties));

              code.push(`
if (!${keys}.includes(k)) {
`);

              gen(
                schema.additionalProperties,
                `${dataRef}[k]`,
                pathExpr === '""' ? `k` : `${pathExpr} + "." + k`,
                depth,
              );

              code.push(`}`);
            } else {
              gen(
                schema.additionalProperties,
                `${dataRef}[k]`,
                pathExpr === '""' ? `k` : `${pathExpr} + "." + k`,
                depth,
              );
            }

            code.push(`}`);
          }

          if (schema.patternProperties) {
            for (const pattern in schema.patternProperties) {
              const propSchema = schema.patternProperties[pattern];
              const regexName = `regex_${pattern.replace(/\W/g, '_')}`;

              code.push(`
const ${regexName} = new RegExp(${JSON.stringify(pattern)});
for (const k in ${dataRef}) {
  if (${regexName}.test(k)) {
`);

              gen(
                propSchema,
                `${dataRef}[k]`,
                pathExpr === '""' ? `k` : `${pathExpr} + "." + k`,
                depth,
              );

              code.push(`
  }
}
`);
            }
          }

          code.push(`
} // end if object
`);
        }

        if (recursive && schema.type === 'array' && schema.items) {
          const loopVar = `i${depth}`;
          code.push(`
if (Array.isArray(${dataRef})) {
  for (let ${loopVar} = 0; ${loopVar} < ${dataRef}.length; ${loopVar}++) {
`);

          gen(
            schema.items,
            `${dataRef}[${loopVar}]`,
            pathExpr === '""'
              ? `"[" + ${loopVar} + "]"`
              : `${pathExpr} + "[" + ${loopVar} + "]"`,
            depth + 1,
          );

          code.push(`
  }
} // end if array
`);
        }

        code.push(`
} else {
  const actual = Array.isArray(${dataRef}) ? "array" : typeof ${dataRef};
  errors.push({
    path: ${pathExpr},
    message: "Expected type '${typeLabel}', got '" + actual + "'"
  });
}
`);
      } else if (schema.enum) {
        const values = JSON.stringify(schema.enum);
        code.push(`
if (!${values}.includes(${dataRef})) {
  errors.push({
    path: ${pathExpr},
    message: "Value '" + ${dataRef} + "' is not one of: ${schema.enum.join(', ')}"
  });
}
`);
      }
    };

    gen(schema, 'data', `""`, 0);

    code.push(`
for (let i = 0; i < customValidators.length; i++) {
  customValidators[i](data, "", errors);
}

return {
  isValid: errors.length === 0,
  errors
};
`);

    const fn = new Function(
      'data',
      'customTypes',
      'customValidators',
      code.join('\n'),
    );

    return (data) => fn(data, customTypes, customValidators);
  }

  generateTypeCheck(type, ref) {
    if (Array.isArray(type)) {
      return type.map((t) => this.generateTypeCheck(t, ref)).join(' || ');
    }

    switch (type) {
      case 'string':
        return `typeof ${ref} === "string"`;

      case 'number':
        return `typeof ${ref} === "number" && Number.isFinite(${ref})`;

      case 'integer':
        return `Number.isInteger(${ref})`;

      case 'boolean':
        return `typeof ${ref} === "boolean"`;

      case 'array':
        return `Array.isArray(${ref})`;

      case 'object':
        return `${ref} !== null && typeof ${ref} === "object" && !Array.isArray(${ref})`;

      case 'null':
        return `${ref} === null`;

      default:
        return `customTypes["${type}"] ? customTypes["${type}"](${ref}) : typeof ${ref} === "${type}"`;
    }
  }
}
