/* eslint camelcase: "off" */
import test from 'node:test';
import assert from 'node:assert/strict';
import { NativeEngine } from '#lib';

// ================================
// BASIC TYPES
// ================================

test('string type validation', () => {
  const schema = { type: 'string' };
  const engine = new NativeEngine();

  assert.equal(engine.validate(schema, 'hello').isValid, true);
  assert.equal(engine.validate(schema, 123).isValid, false);
});

test('number type validation', () => {
  const schema = { type: 'number' };
  const engine = new NativeEngine();

  assert.equal(engine.validate(schema, 42).isValid, true);
  assert.equal(engine.validate(schema, '42').isValid, false);
});

test('integer type validation', () => {
  const schema = { type: 'integer' };
  const engine = new NativeEngine();

  assert.equal(engine.validate(schema, 10).isValid, true);
  assert.equal(engine.validate(schema, 10.5).isValid, false);
});

test('boolean type validation', () => {
  const schema = { type: 'boolean' };
  const engine = new NativeEngine();

  assert.equal(engine.validate(schema, true).isValid, true);
  assert.equal(engine.validate(schema, false).isValid, true);
  assert.equal(engine.validate(schema, 1).isValid, false);
});

test('null type validation', () => {
  const schema = { type: 'null' };
  const engine = new NativeEngine();

  assert.equal(engine.validate(schema, null).isValid, true);
  assert.equal(engine.validate(schema, undefined).isValid, false);
});

// ================================
// OBJECTS
// ================================

test('valid object', () => {
  const schema = {
    type: 'object',
    properties: { name: { type: 'string' }, age: { type: 'integer' } },
  };
  const data = { name: 'John', age: 30 };
  const engine = new NativeEngine();

  const result = engine.validate(schema, data);
  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, []);
});

test('nested object', () => {
  const schema = {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'integer' },
        },
      },
    },
  };
  const data = { user: { name: 'Alice', age: 25 } };
  const engine = new NativeEngine();

  const result = engine.validate(schema, data);
  assert.equal(result.isValid, true);
});

test('strict mode: additional properties not allowed', () => {
  const schema = {
    type: 'object',
    properties: { name: { type: 'string' } },
    additionalProperties: false,
  };
  const data = { name: 'John', age: 30 };
  const engine = new NativeEngine({ strict: true });

  const result = engine.validate(schema, data);
  assert.equal(result.isValid, false);
  assert.equal(result.errors[0].path, 'age');
});

test('additionalProperties as schema', () => {
  const schema = {
    type: 'object',
    properties: { name: { type: 'string' } },
    additionalProperties: { type: 'number' },
  };
  const data = { name: 'John', age: 30, score: 'bad' };
  const engine = new NativeEngine();

  const result = engine.validate(schema, data);
  assert.equal(result.isValid, false);
  assert.equal(result.errors[0].path, 'score');
});

// ================================
// ARRAY
// ================================

test('array of numbers', () => {
  const schema = { type: 'array', items: { type: 'number' } };
  const data = [1, 2, 3];
  const engine = new NativeEngine();

  const result = engine.validate(schema, data);
  assert.equal(result.isValid, true);
});

test('array validation failure', () => {
  const schema = { type: 'array', items: { type: 'number' } };
  const data = [1, 'two', 3];
  const engine = new NativeEngine();

  const result = engine.validate(schema, data);
  assert.equal(result.isValid, false);
  assert.equal(result.errors[0].path, '[1]');
});

// ================================
// ENUM
// ================================

test('enum validation', () => {
  const schema = { type: 'string', enum: ['red', 'green', 'blue'] };
  const data = 'yellow';
  const engine = new NativeEngine();

  const result = engine.validate(schema, data);
  assert.equal(result.isValid, false);
  assert.match(result.errors[0].message, /not one of/);
});

// ================================
// NUMBER CONSTRAINTS
// ================================

test('minimum/maximum validation', () => {
  const engine = new NativeEngine();

  const minSchema = { type: 'number', minimum: 10 };
  assert.equal(engine.validate(minSchema, 5).isValid, false);

  const maxSchema = { type: 'number', maximum: 10 };
  assert.equal(engine.validate(maxSchema, 15).isValid, false);
});

test('exclusiveMinimum/exclusiveMaximum', () => {
  const engine = new NativeEngine();

  const exclMinSchema = { type: 'number', exclusiveMinimum: 10 };
  assert.equal(engine.validate(exclMinSchema, 10).isValid, false);

  const exclMaxSchema = { type: 'number', exclusiveMaximum: 10 };
  assert.equal(engine.validate(exclMaxSchema, 10).isValid, false);
});

test('multipleOf validation', () => {
  const schema = { type: 'number', multipleOf: 3 };
  const data = 10;
  const engine = new NativeEngine();

  const result = engine.validate(schema, data);
  assert.equal(result.isValid, false);
  assert.match(result.errors[0].message, /not a multiple of/);
});

// ================================
// PATTERN PROPERTIES
// ================================

test('patternProperties', () => {
  const schema = {
    type: 'object',
    patternProperties: {
      '^S_': { type: 'string' },
      '^N_': { type: 'number' },
    },
  };

  const data = { S_name: 'John', N_age: 30, S_address: 'NY', N_score: '100' };
  const engine = new NativeEngine();

  const result = engine.validate(schema, data);
  assert.equal(result.isValid, false);
  assert.equal(result.errors[0].path, 'N_score');
});

// ================================
// CUSTOM VALIDATORS
// ================================

test('custom validator function', () => {
  const schema = { type: 'object', properties: { age: { type: 'integer' } } };
  const customValidators = [
    (data, path, errors) => {
      if (data.age < 18) {
        errors.push({ path: 'age', message: 'Must be at least 18' });
      }
    },
  ];
  const data = { age: 16 };
  const engine = new NativeEngine({ customValidators });

  const result = engine.validate(schema, data);
  assert.equal(result.isValid, false);
  assert.equal(result.errors[0].path, 'age');
});

// ================================
// UNION TYPES
// ================================

test('union type', () => {
  const schema = { type: ['string', 'number'] };
  const engine = new NativeEngine();

  assert.equal(engine.validate(schema, 'hello').isValid, true);
  assert.equal(engine.validate(schema, 42).isValid, true);
  assert.equal(engine.validate(schema, true).isValid, false);
});
