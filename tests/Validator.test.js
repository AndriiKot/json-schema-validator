import test from 'node:test';
import assert from 'node:assert/strict';
import { Validator } from '#lib';

// ==================================================
// BASIC USAGE
// ==================================================

test('Validator constructor with default options', () => {
  const validator = new Validator();
  assert.ok(validator instanceof Validator);
  assert.deepEqual(validator.options, {
    recursive: true,
    strict: true,
    customTypes: {},
    customValidators: [],
  });
});

test('validate() returns valid result for correct data', () => {
  const validator = new Validator();
  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'integer' },
    },
  };
  const data = { name: 'John', age: 30 };
  const result = validator.validate(schema, data);

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, []);
});

test('validate() returns errors for invalid data', () => {
  const validator = new Validator();
  const schema = {
    type: 'object',
    properties: {
      age: { type: 'number' },
    },
  };
  const data = { age: '30' };
  const result = validator.validate(schema, data);

  assert.equal(result.isValid, false);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].path, 'age');
});

// ==================================================
// COMPILE & CACHE
// ==================================================

test('compile() returns a validation function', () => {
  const validator = new Validator();
  const schema = { type: 'string' };
  const validate = validator.compile(schema);

  assert.equal(typeof validate, 'function');
  assert.equal(validate('hello').isValid, true);
  assert.equal(validate(123).isValid, false);
});

test('compile() caches compiled function for same schema object', () => {
  const validator = new Validator();
  const schema = { type: 'number' };

  const fn1 = validator.compile(schema);
  const fn2 = validator.compile(schema);

  assert.strictEqual(fn1, fn2);
});

test('compile() does not share cache for different schema objects (even if identical)', () => {
  const validator = new Validator();
  const schemaA = { type: 'string' };
  const schemaB = { type: 'string' };

  const fn1 = validator.compile(schemaA);
  const fn2 = validator.compile(schemaB);

  assert.notStrictEqual(fn1, fn2);
});

test('clearCache() removes all cached compiled functions', () => {
  const validator = new Validator();
  const schema = { type: 'boolean' };

  const fn1 = validator.compile(schema);
  validator.clearCache();
  const fn2 = validator.compile(schema);

  assert.notStrictEqual(fn1, fn2);
});

// ==================================================
// OPTIONS PROPAGATION
// ==================================================

test('Validator passes strict option to NativeEngine', () => {
  const validator = new Validator({ strict: true });
  const schema = {
    type: 'object',
    properties: { name: { type: 'string' } },
    additionalProperties: false,
  };
  const data = { name: 'John', age: 30 };
  const result = validator.validate(schema, data);

  assert.equal(result.isValid, false);
  assert.equal(result.errors[0].path, 'age');
});

test('Validator passes recursive: false to CodeGenerator', () => {
  const validator = new Validator({ recursive: false });
  const schema = {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: { name: { type: 'string' } },
      },
    },
  };
  const data = { user: { name: 123 } };
  const validate = validator.compile(schema);
  const result = validate(data);

  assert.equal(result.isValid, true);
});

test('Validator passes customTypes to both engines', () => {
  const customTypes = {
    uuid: (value) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      ),
  };

  const validator = new Validator({ customTypes });

  const schema = {
    type: 'object',
    properties: { id: { type: 'uuid' } },
  };

  const validData = { id: '123e4567-e89b-12d3-a456-426614174000' };
  const invalidData = { id: 'not-uuid' };

  assert.equal(validator.validate(schema, validData).isValid, true);
  assert.equal(validator.validate(schema, invalidData).isValid, false);

  const validate = validator.compile(schema);

  assert.equal(validate(validData).isValid, true);
  assert.equal(validate(invalidData).isValid, false);
});

test('Validator passes customValidators to NativeEngine', () => {
  const customValidators = [
    (data, path, errors) => {
      if (data.age < 18) {
        errors.push({ path: 'age', message: 'Must be at least 18' });
      }
    },
  ];

  const validator = new Validator({ customValidators });

  const schema = {
    type: 'object',
    properties: { age: { type: 'integer' } },
  };

  const data = { age: 16 };

  const result = validator.validate(schema, data);

  assert.equal(result.isValid, false);
  assert.equal(result.errors[0].path, 'age');
  assert.match(result.errors[0].message, /at least 18/);
});

// ==================================================
// EDGE CASES
// ==================================================

test('validate() works with complex schemas', () => {
  const validator = new Validator();

  const schema = {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'integer' },
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  };

  const data = [
    { id: 1, tags: ['a', 'b'] },
    { id: 2, tags: ['c'] },
  ];

  const result = validator.validate(schema, data);

  assert.equal(result.isValid, true);
});

test('compile() respects enum constraints', () => {
  const validator = new Validator();

  const schema = { type: 'string', enum: ['red', 'green'] };

  const validate = validator.compile(schema);

  assert.equal(validate('red').isValid, true);
  assert.equal(validate('blue').isValid, false);
});

test('multiple compile calls with different schemas do not interfere', () => {
  const validator = new Validator();

  const schema1 = { type: 'number' };
  const schema2 = { type: 'string' };

  const fn1 = validator.compile(schema1);
  const fn2 = validator.compile(schema2);

  assert.equal(fn1(42).isValid, true);
  assert.equal(fn1('42').isValid, false);
  assert.equal(fn2('hello').isValid, true);
  assert.equal(fn2(42).isValid, false);
});

// ==================================================
// ADDITIONAL EDGE CASE TESTS
// ==================================================

test('null data is valid for type null', () => {
  const validator = new Validator();
  const schema = { type: 'null' };

  const result = validator.validate(schema, null);

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, []);
});

test('validate() reports correct nested path', () => {
  const validator = new Validator();

  const schema = {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          age: { type: 'number' },
        },
      },
    },
  };

  const data = {
    user: { age: '30' },
  };

  const result = validator.validate(schema, data);

  assert.equal(result.isValid, false);
  assert.equal(result.errors[0].path, 'user.age');
});

test('validate() reports correct array index path', () => {
  const validator = new Validator();

  const schema = {
    type: 'array',
    items: { type: 'number' },
  };

  const data = [1, 2, '3'];

  const result = validator.validate(schema, data);

  assert.equal(result.isValid, false);
  assert.equal(result.errors[0].path, '[2]');
});

test('required fields must exist', () => {
  const validator = new Validator();

  const schema = {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' },
    },
  };

  const data = {};

  const result = validator.validate(schema, data);

  assert.equal(result.isValid, false);
});

test('additionalProperties false rejects unknown fields', () => {
  const validator = new Validator();

  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
    },
    additionalProperties: false,
  };

  const data = {
    name: 'John',
    age: 30,
  };

  const result = validator.validate(schema, data);

  assert.equal(result.isValid, false);
  assert.equal(result.errors[0].path, 'age');
});

test('compile() and validate() return identical results', () => {
  const validator = new Validator();

  const schema = {
    type: 'object',
    properties: {
      age: { type: 'number' },
    },
  };

  const data = { age: '30' };

  const result1 = validator.validate(schema, data);

  const validate = validator.compile(schema);
  const result2 = validate(data);

  assert.deepEqual(result1, result2);
});

test('validate() does not mutate schema', () => {
  const validator = new Validator();

  const schema = { type: 'string' };
  const schemaCopy = JSON.parse(JSON.stringify(schema));

  validator.validate(schema, 'hello');

  assert.deepEqual(schema, schemaCopy);
});

test('validate() does not mutate data', () => {
  const validator = new Validator();

  const schema = { type: 'object' };
  const data = { a: 1 };
  const dataCopy = JSON.parse(JSON.stringify(data));

  validator.validate(schema, data);

  assert.deepEqual(data, dataCopy);
});

test('compile() works with nested arrays', () => {
  const validator = new Validator();

  const schema = {
    type: 'array',
    items: {
      type: 'array',
      items: { type: 'number' },
    },
  };

  const validate = validator.compile(schema);

  assert.equal(validate([[1, 2], [3]]).isValid, true);
  assert.equal(validate([[1, '2']]).isValid, false);
});

test('multiple errors are collected', () => {
  const validator = new Validator();

  const schema = {
    type: 'object',
    properties: {
      age: { type: 'number' },
      name: { type: 'string' },
    },
  };

  const data = {
    age: '30',
    name: 123,
  };

  const result = validator.validate(schema, data);

  assert.equal(result.isValid, false);
  assert.equal(result.errors.length, 2);
});