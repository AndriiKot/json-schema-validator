import test from 'node:test';
import assert from 'node:assert/strict';
import { CodeGenerator } from '#lib';

test('valid object with fields', () => {
  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'integer' },
    },
  };

  const data = {
    name: 'John',
    age: 30,
  };

  const generator = new CodeGenerator();
  const validate = generator.compile(schema);
  const result = validate(data);

  assert.equal(result.isValid, true);
  assert.deepEqual(result.errors, []);
});

test('type validation failure', () => {
  const schema = {
    type: 'object',
    properties: {
      age: { type: 'number' },
    },
  };

  const data = {
    age: '30',
  };

  const generator = new CodeGenerator();
  const validate = generator.compile(schema);
  const result = validate(data);

  assert.equal(result.isValid, false);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].path, 'age');
  assert.match(result.errors[0].message, /Expected type 'number'/);
});

test('array validation', () => {
  const schema = {
    type: 'array',
    items: { type: 'number' },
  };

  const data = [1, 2, 3];

  const generator = new CodeGenerator();
  const validate = generator.compile(schema);
  const result = validate(data);

  assert.equal(result.isValid, true);
});

test('array validation failure', () => {
  const schema = {
    type: 'array',
    items: { type: 'number' },
  };

  const data = [1, 'two', 3];

  const generator = new CodeGenerator();
  const validate = generator.compile(schema);
  const result = validate(data);

  assert.equal(result.isValid, false);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].path, '[1]');
});

test('enum validation', () => {
  const schema = {
    type: 'string',
    enum: ['red', 'green', 'blue'],
  };

  const data = 'yellow';

  const generator = new CodeGenerator();
  const validate = generator.compile(schema);
  const result = validate(data);

  assert.equal(result.isValid, false);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].message, /not one of/);
});

test('number minimum validation', () => {
  const schema = {
    type: 'number',
    minimum: 10,
  };

  const data = 5;

  const generator = new CodeGenerator();
  const validate = generator.compile(schema);
  const result = validate(data);

  assert.equal(result.isValid, false);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].path, '');
  assert.match(result.errors[0].message, /< minimum/);
});

test('number maximum validation', () => {
  const schema = {
    type: 'number',
    maximum: 10,
  };

  const data = 15;

  const generator = new CodeGenerator();
  const validate = generator.compile(schema);
  const result = validate(data);

  assert.equal(result.isValid, false);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].message, /> maximum/);
});

test('exclusive minimum validation', () => {
  const schema = {
    type: 'number',
    exclusiveMinimum: 10,
  };

  const data = 10;

  const generator = new CodeGenerator();
  const validate = generator.compile(schema);
  const result = validate(data);

  assert.equal(result.isValid, false);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].message, /<= exclusiveMinimum/);
});

test('multipleOf validation', () => {
  const schema = {
    type: 'number',
    multipleOf: 3,
  };

  const data = 10;

  const generator = new CodeGenerator();
  const validate = generator.compile(schema);
  const result = validate(data);

  assert.equal(result.isValid, false);
  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].message, /not multipleOf/);
});

test('nested object validation', () => {
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

  const data = {
    user: {
      name: 'Alice',
      age: 25,
    },
  };

  const generator = new CodeGenerator();
  const validate = generator.compile(schema);
  const result = validate(data);

  assert.equal(result.isValid, true);
});

test('strict mode: additional property not allowed', () => {
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

  const generator = new CodeGenerator({ strict: true });
  const validate = generator.compile(schema);
  const result = validate(data);

  assert.equal(result.isValid, false);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].path, 'age');
  assert.match(result.errors[0].message, /Unexpected field/);
});

test('additionalProperties as schema', () => {
  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
    },
    additionalProperties: { type: 'number' },
  };

  const data = {
    name: 'John',
    age: 30,
    score: 'bad',
  };

  const generator = new CodeGenerator();
  const validate = generator.compile(schema);
  const result = validate(data);

  assert.equal(result.isValid, false);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].path, 'score');
});

test('patternProperties validation', () => {
  const schema = {
    type: 'object',
    patternProperties: {
      '^S_': { type: 'string' },
      '^N_': { type: 'number' },
    },
  };

  const data = {
    S_name: 'John', // eslint-disable-line camelcase
    N_age: 30, // eslint-disable-line camelcase
    S_address: 'NY', // eslint-disable-line camelcase
    N_score: '100', // eslint-disable-line camelcase
  };

  const generator = new CodeGenerator();
  const validate = generator.compile(schema);
  const result = validate(data);

  assert.equal(result.isValid, false);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].path, 'N_score');
});

test('custom type validator', () => {
  const schema = {
    type: 'object',
    properties: {
      id: { type: 'uuid' },
    },
  };

  const customTypes = {
    uuid: (value) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      ),
  };

  const dataValid = { id: '123e4567-e89b-12d3-a456-426614174000' };
  const dataInvalid = { id: 'not-uuid' };

  const generator = new CodeGenerator({ customTypes });
  const validate = generator.compile(schema);

  const resultValid = validate(dataValid);
  assert.equal(resultValid.isValid, true);

  const resultInvalid = validate(dataInvalid);
  assert.equal(resultInvalid.isValid, false);
  assert.equal(resultInvalid.errors[0].path, 'id');
});

test('custom validator function', () => {
  const schema = {
    type: 'object',
    properties: {
      age: { type: 'integer' },
    },
  };

  const customValidators = [
    (data, path, errors) => {
      if (data.age < 18) {
        errors.push({ path: 'age', message: 'Must be at least 18' });
      }
    },
  ];

  const data = { age: 16 };

  const generator = new CodeGenerator({ customValidators });
  const validate = generator.compile(schema);
  const result = validate(data);

  assert.equal(result.isValid, false);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].path, 'age');
  assert.match(result.errors[0].message, /at least 18/);
});

test('recursive: false disables deep validation', () => {
  const schema = {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
    },
  };

  const data = {
    user: {
      name: 123,
    },
  };

  const generator = new CodeGenerator({ recursive: false });
  const validate = generator.compile(schema);
  const result = validate(data);

  assert.equal(result.isValid, true);
});

test('union type (array of types)', () => {
  const schema = {
    type: ['string', 'number'],
  };

  const generator = new CodeGenerator();
  const validate = generator.compile(schema);

  assert.equal(validate('hello').isValid, true);
  assert.equal(validate(42).isValid, true);
  assert.equal(validate(true).isValid, false);
});

test('null type', () => {
  const schema = {
    type: 'null',
  };

  const generator = new CodeGenerator();
  const validate = generator.compile(schema);

  assert.equal(validate(null).isValid, true);
  assert.equal(validate(undefined).isValid, false);
});

test('integer type', () => {
  const schema = {
    type: 'integer',
  };

  const generator = new CodeGenerator();
  const validate = generator.compile(schema);

  assert.equal(validate(10).isValid, true);
  assert.equal(validate(10.5).isValid, false);
});
