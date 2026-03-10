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

    const gen = (schema, dataRef, pathExpr) => {
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

      // TYPE
      if (schema.type) {
        const check = this.generateTypeCheck(schema.type, dataRef);
        const typeLabel = Array.isArray(schema.type)
          ? schema.type.join(", ")
          : schema.type;

        code.push(`
if (!(${check})) {
  const actual = Array.isArray(${dataRef}) ? "array" : typeof ${dataRef};
  errors.push({
    path: ${pathExpr},
    message: "Expected type '${typeLabel}', got '" + actual + "'"
  });
}
`);
      }

      // ENUM
      if (schema.enum) {
        const values = JSON.stringify(schema.enum);

        code.push(`
if (!${values}.includes(${dataRef})) {
  errors.push({
    path: ${pathExpr},
    message: "Value '" + ${dataRef} + "' is not one of: ${schema.enum.join(", ")}"
  });
}
`);
      }

      // NUMBER RULES
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

      // OBJECT
      if (recursive && schema.type === "object") {
        if (schema.properties) {
          for (const key in schema.properties) {
            const prop = schema.properties[key];
            const ref = `${dataRef}.${key}`;

            const childPath =
              pathExpr === '""'
                ? `"${key}"`
                : `${pathExpr} + "." + "${key}"`;

            code.push(`
if (${dataRef}.${key} !== undefined) {
`);
            gen(prop, ref, childPath);
            code.push(`}`);
          }
        }

        // additionalProperties false
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

        // additionalProperties schema
        if (typeof schema.additionalProperties === "object") {
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
              pathExpr === '""'
                ? `k`
                : `${pathExpr} + "." + k`
            );

            code.push(`}`);
          } else {
            gen(
              schema.additionalProperties,
              `${dataRef}[k]`,
              pathExpr === '""'
                ? `k`
                : `${pathExpr} + "." + k`
            );
          }

          code.push(`}`);
        }

        // patternProperties
        if (schema.patternProperties) {
          for (const pattern in schema.patternProperties) {
            const propSchema = schema.patternProperties[pattern];
            const regexName = `regex_${pattern.replace(/\W/g, "_")}`;

            code.push(`
const ${regexName} = new RegExp(${JSON.stringify(pattern)});
for (const k in ${dataRef}) {
  if (${regexName}.test(k)) {
`);

            gen(
              propSchema,
              `${dataRef}[k]`,
              pathExpr === '""'
                ? `k`
                : `${pathExpr} + "." + k`
            );

            code.push(`
  }
}
`);
          }
        }
      }

      // ARRAY
      if (recursive && schema.type === "array" && schema.items) {
        code.push(`
for (let i = 0; i < ${dataRef}.length; i++) {
`);

        gen(
          schema.items,
          `${dataRef}[i]`,
          pathExpr === '""'
            ? `"[" + i + "]"`
            : `${pathExpr} + "[" + i + "]"`
        );

        code.push(`}`);
      }
    };

    gen(schema, "data", `""`);

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
      "data",
      "customTypes",
      "customValidators",
      code.join("\n")
    );

    return (data) => fn(data, customTypes, customValidators);
  }

  generateTypeCheck(type, ref) {
    if (Array.isArray(type)) {
      return type.map((t) => this.generateTypeCheck(t, ref)).join(" || ");
    }

    switch (type) {
      case "string":
        return `typeof ${ref} === "string"`;

      case "number":
        return `typeof ${ref} === "number" && Number.isFinite(${ref})`;

      case "integer":
        return `Number.isInteger(${ref})`;

      case "boolean":
        return `typeof ${ref} === "boolean"`;

      case "array":
        return `Array.isArray(${ref})`;

      case "object":
        return `${ref} !== null && typeof ${ref} === "object" && !Array.isArray(${ref})`;

      case "null":
        return `${ref} === null`;

      default:
        return `customTypes["${type}"] ? customTypes["${type}"](${ref}) : typeof ${ref} === "${type}"`;
    }
  }
}
