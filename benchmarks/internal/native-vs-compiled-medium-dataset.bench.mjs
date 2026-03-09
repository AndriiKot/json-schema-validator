import { Bench } from 'tinybench';
import { Validator } from '#lib';
import { userProfileSchema } from '../schemas/medium.schema.mjs';

import { dataset10 } from '../datasets/medium/dataset-10.mjs';
import { dataset100 } from '../datasets/medium/dataset-100.mjs';      // новый
import { dataset1000 } from '../datasets/medium/dataset-1000.mjs';
import { dataset100000 } from '../datasets/medium/dataset-100000.mjs';

const validator = new Validator();
const compiled = validator.compile(userProfileSchema);

function validateAllNative(dataset) {
  for (const data of dataset) {
    validator.validate(userProfileSchema, data);
  }
}

function validateAllCompiled(dataset) {
  for (const data of dataset) {
    compiled(data);
  }
}

const bench = new Bench({ time: 100 });

bench
  // dataset-10
  .add('Native dataset-10', () => validateAllNative(dataset10))
  .add('Compiled dataset-10', () => validateAllCompiled(dataset10))

  // dataset-100
  .add('Native dataset-100', () => validateAllNative(dataset100))
  .add('Compiled dataset-100', () => validateAllCompiled(dataset100))

  // dataset-1000
  .add('Native dataset-1000', () => validateAllNative(dataset1000))
  .add('Compiled dataset-1000', () => validateAllCompiled(dataset1000))

  // dataset-100000
  .add('Native dataset-100000', () => validateAllNative(dataset100000))
  .add('Compiled dataset-100000', () => validateAllCompiled(dataset100000));

await bench.run();

const results = bench.table();
console.table(results);
