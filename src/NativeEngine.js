export class NativeEngine {
  constructor(options = {}) {
    const {
      recursive = true,
      strict = false,
      customValidators = [],
      customTypes = {},
    } = options;

    this.options = { recursive, strict };
    this.customValidators = customValidators;
    this.customTypes = customTypes;
    this.errors = [];
  }

  // ==================================================
  // PUBLIC
  // ==================================================

  validate(schema, data) {
    this.errors = [];

    this.#validateBySchema(schema, data, '');

    for (const validator of this.customValidators) {
      validator(data, '', this.errors);
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
    };
  }

  // ==================================================
  // TYPE CHECKING
  // ==================================================

  #checkType(value, expectedType) {
    if (Array.isArray(expectedType)) {
      return expectedType.some((t) => this.#checkType(value, t));
    }

    if (this.customTypes[expectedType]) {
      return this.customTypes[expectedType](value);
    }

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
          typeof value === 'object' && value !== null && !Array.isArray(value)
        );

      case 'null':
        return value === null;

      default:
        return typeof value === expectedType;
    }
  }

  #typeError(path, expected, value) {
    const actual = Array.isArray(value) ? 'array' : typeof value;

    const expectedStr = Array.isArray(expected)
      ? expected.join(', ')
      : expected;

    this.errors.push({
      path: path || 'root',
      message: `Expected type '${expectedStr}', got '${actual}'`,
    });
  }

  // ==================================================
  // COMMON RULES
  // ==================================================

  #validateEnum(value, schema, path) {
    if (schema.enum && !schema.enum.includes(value)) {
      this.errors.push({
        path,
        message: `Value '${value}' is not one of: ${schema.enum.join(', ')}`,
      });
    }
  }

  #validateFormat(value, schema, path) {
    if (!schema.format) return;

    if (schema.format === 'date-time') {
      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        this.errors.push({
          path,
          message: `Value '${value}' is not a valid ISO 8601 date-time`,
        });
      }
    }
  }

  #validateNumberRules(value, schema, path) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return;

    if (schema.minimum !== undefined && value < schema.minimum) {
      this.errors.push({
        path,
        message: `Value ${value} is less than minimum ${schema.minimum}`,
      });
    }

    if (
      schema.exclusiveMinimum !== undefined &&
      value <= schema.exclusiveMinimum
    ) {
      this.errors.push({
        path,
        message: `Value ${value} must be greater than ${schema.exclusiveMinimum}`,
      });
    }

    if (schema.maximum !== undefined && value > schema.maximum) {
      this.errors.push({
        path,
        message: `Value ${value} is greater than maximum ${schema.maximum}`,
      });
    }

    if (
      schema.exclusiveMaximum !== undefined &&
      value >= schema.exclusiveMaximum
    ) {
      this.errors.push({
        path,
        message: `Value ${value} must be less than ${schema.exclusiveMaximum}`,
      });
    }

    if (schema.multipleOf !== undefined) {
      if (value % schema.multipleOf !== 0) {
        this.errors.push({
          path,
          message: `Value ${value} is not a multiple of ${schema.multipleOf}`,
        });
      }
    }
  }

  #applyCommonRules(value, schema, path) {
    this.#validateEnum(value, schema, path);
    this.#validateFormat(value, schema, path);

    if (schema.type === 'number' || schema.type === 'integer') {
      this.#validateNumberRules(value, schema, path);
    }
  }

  // ==================================================
  // OBJECT
  // ==================================================

  #validateObject(schema, data, path = '') {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return;

    const { strict } = this.options;
    const validatedKeys = new Set();

    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (!(field in data)) {
          this.errors.push({
            path: path ? `${path}.${field}` : field,
            message: `Required field '${field}' is missing`,
          });
        }
      }
    }

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        validatedKeys.add(key);

        if (key in data) {
          const currentPath = path ? `${path}.${key}` : key;

          this.#validateBySchema(propSchema, data[key], currentPath);
        }
      }
    }

    if (schema.patternProperties) {
      for (const [pattern, propSchema] of Object.entries(
        schema.patternProperties,
      )) {
        const regex = new RegExp(pattern);

        for (const key of Object.keys(data)) {
          if (regex.test(key)) {
            validatedKeys.add(key);

            const currentPath = path ? `${path}.${key}` : key;

            this.#validateBySchema(propSchema, data[key], currentPath);
          }
        }
      }
    }

    for (const key of Object.keys(data)) {
      if (validatedKeys.has(key)) continue;

      const currentPath = path ? `${path}.${key}` : key;

      if (schema.additionalProperties === false) {
        this.errors.push({
          path: currentPath,
          message: `Unexpected field '${key}'`,
        });

        continue;
      }

      if (typeof schema.additionalProperties === 'object') {
        this.#validateBySchema(
          schema.additionalProperties,
          data[key],
          currentPath,
        );
      } else if (strict && !schema.additionalProperties) {
        this.errors.push({
          path: currentPath,
          message: `Unexpected field '${key}'`,
        });
      }
    }
  }

  // ==================================================
  // ARRAY
  // ==================================================

  #validateArray(schema, data, path) {
    if (!Array.isArray(data)) {
      this.#typeError(path, 'array', data);
      return;
    }

    if (!schema.items) return;

    data.forEach((item, index) => {
      const itemPath = `${path}[${index}]`;

      this.#validateBySchema(schema.items, item, itemPath);
    });
  }

  // ==================================================
  // UNIVERSAL VALIDATOR
  // ==================================================

  #validateBySchema(schema, value, path) {
    if (!schema) return;

    if (schema.type && !this.#checkType(value, schema.type)) {
      this.#typeError(path, schema.type, value);
      return;
    }

    this.#applyCommonRules(value, schema, path);

    if (!this.options.recursive) return;

    if (schema.type === 'object') {
      this.#validateObject(schema, value, path);
    }

    if (schema.type === 'array') {
      this.#validateArray(schema, value, path);
    }
  }
}
