import { Bench } from 'tinybench';
import Ajv from 'ajv';
import { Validator } from '#lib';
import { userProfileSchema } from '../schemas/medium.schema.mjs';

import { dataset10 } from '../datasets/medium/dataset-10.mjs';
import { dataset100 } from '../datasets/medium/dataset-100.mjs';
import { dataset1000 } from '../datasets/medium/dataset-1000.mjs';
import { dataset100000 } from '../datasets/medium/dataset-100000.mjs';

// === Validators initialization ===
const validator = new Validator();
const compiledValidator = validator.compile(userProfileSchema);

// AJV
const ajv = new Ajv({ strict: false });
const ajvValidate = ajv.compile(userProfileSchema);

// === Validation functions ===
function validateAllNative(dataset) {
  for (const data of dataset) {
    validator.validate(userProfileSchema, data);
  }
}

function validateAllCompiled(dataset) {
  for (const data of dataset) {
    compiledValidator(data);
  }
}

function validateAllAjv(dataset) {
  for (const data of dataset) {
    ajvValidate(data);
  }
}

// === Bench ===
const bench = new Bench({ time: 100 });

// dataset-10
bench
  .add('Native Validator dataset-10', () => validateAllNative(dataset10))
  .add('Compiled Validator dataset-10', () => validateAllCompiled(dataset10))
  .add('AJV dataset-10', () => validateAllAjv(dataset10))

  // dataset-100
  .add('Native Validator dataset-100', () => validateAllNative(dataset100))
  .add('Compiled Validator dataset-100', () => validateAllCompiled(dataset100))
  .add('AJV dataset-100', () => validateAllAjv(dataset100))

  // dataset-1000
  .add('Native Validator dataset-1000', () => validateAllNative(dataset1000))
  .add('Compiled Validator dataset-1000', () => validateAllCompiled(dataset1000))
  .add('AJV dataset-1000', () => validateAllAjv(dataset1000))

  // dataset-100000
  .add('Native Validator dataset-100000', () => validateAllNative(dataset100000))
  .add('Compiled Validator dataset-100000', () => validateAllCompiled(dataset100000))
  .add('AJV dataset-100000', () => validateAllAjv(dataset100000));

// === Run ===
await bench.run();

// === Print results ===
const results = bench.table();
console.table(results);
