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
    const { recursive, strict, customTypes, customValidators } = this.options;

    const compiledFn = (data) => {
      const errors = [];

      const checkType = (value, expectedType) => {
        if (Array.isArray(expectedType)) {
          return expectedType.some((t) => checkType(value, t));
        }
        if (customTypes[expectedType]) return customTypes[expectedType](value);
        switch (expectedType) {
          case 'integer':
            return Number.isInteger(value);
          case 'number':
            return typeof value === 'number' && Number.isFinite(value);
          case 'string':
            return typeof value === 'string';
          case 'boolean':
            return typeof value === 'boolean';
          case 'array':
            return Array.isArray(value);
          case 'object':
            return (
              typeof value === 'object' &&
              value !== null &&
              !Array.isArray(value)
            );
          case 'null':
            return value === null;
          default:
            return typeof value === expectedType;
        }
      };

      const typeError = (path, expected, value) => {
        const actual = Array.isArray(value) ? 'array' : typeof value;
        const expectedStr = Array.isArray(expected)
          ? expected.join(', ')
          : expected;
        errors.push({
          path,
          message: `Expected type '${expectedStr}', got '${actual}'`,
        });
      };

      const applyRules = (value, schema, path) => {
        if (schema.enum && !schema.enum.includes(value)) {
          errors.push({
            path,
            message: `Value '${value}' is not one of: ${schema.enum.join(', ')}`,
          });
        }

        if (typeof value === 'number') {
          if (schema.minimum !== undefined && value < schema.minimum) {
            errors.push({
              path,
              message: `Value ${value} < minimum ${schema.minimum}`,
            });
          }
          if (schema.maximum !== undefined && value > schema.maximum) {
            errors.push({
              path,
              message: `Value ${value} > maximum ${schema.maximum}`,
            });
          }
          if (
            schema.exclusiveMinimum !== undefined &&
            value <= schema.exclusiveMinimum
          ) {
            errors.push({
              path,
              message: `Value ${value} <= exclusiveMinimum ${schema.exclusiveMinimum}`,
            });
          }
          if (
            schema.exclusiveMaximum !== undefined &&
            value >= schema.exclusiveMaximum
          ) {
            errors.push({
              path,
              message: `Value ${value} >= exclusiveMaximum ${schema.exclusiveMaximum}`,
            });
          }
          if (
            schema.multipleOf !== undefined &&
            value % schema.multipleOf !== 0
          ) {
            errors.push({
              path,
              message: `Value ${value} not multipleOf ${schema.multipleOf}`,
            });
          }
        }
      };

      const validateSchema = (schema, value, path = '') => {
        if (schema.type && !checkType(value, schema.type)) {
          typeError(path, schema.type, value);
          return;
        }

        applyRules(value, schema, path);

        if (!recursive) return;

        if (schema.type === 'object' && value && typeof value === 'object') {
          const validatedKeys = new Set();

          // properties
          if (schema.properties) {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
              validatedKeys.add(key);
              if (key in value) {
                validateSchema(
                  propSchema,
                  value[key],
                  path ? `${path}.${key}` : key,
                );
              }
            }
          }

          // patternProperties
          if (schema.patternProperties) {
            for (const [pattern, propSchema] of Object.entries(
              schema.patternProperties,
            )) {
              const regex = new RegExp(pattern);
              for (const key of Object.keys(value)) {
                if (regex.test(key)) {
                  validatedKeys.add(key);
                  validateSchema(
                    propSchema,
                    value[key],
                    path ? `${path}.${key}` : key,
                  );
                }
              }
            }
          }

          // additionalProperties
          if (
            schema.additionalProperties &&
            typeof schema.additionalProperties === 'object'
          ) {
            for (const key of Object.keys(value)) {
              if (!validatedKeys.has(key)) {
                validateSchema(
                  schema.additionalProperties,
                  value[key],
                  path ? `${path}.${key}` : key,
                );
              }
            }
          }

          // strict mode
          if (strict && !schema.additionalProperties) {
            for (const key of Object.keys(value)) {
              if (!validatedKeys.has(key)) {
                errors.push({
                  path: path ? `${path}.${key}` : key,
                  message: `Unexpected field '${key}'`,
                });
              }
            }
          }
        }

        if (schema.type === 'array' && Array.isArray(value)) {
          value.forEach((item, i) =>
            validateSchema(schema.items, item, `${path}[${i}]`),
          );
        }
      };

      validateSchema(schema, data);

      for (const validator of customValidators) {
        validator(data, '', errors);
      }

      return { isValid: errors.length === 0, errors };
    };

    return compiledFn;
  }
}
