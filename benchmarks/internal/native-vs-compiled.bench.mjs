import { Bench } from 'tinybench';
import { Validator } from '#lib';

const validator = new Validator();

const schema = {
  type: 'object',
  properties: {
    id: { type: 'number' },
    name: { type: 'string' },
  },
};

const data = {
  id: 1,
  name: 'John',
};

const compiled = validator.compile(schema);

const bench = new Bench({ time: 1000 });

bench
  .add('NativeEngine', () => {
    validator.validate(schema, data);
  })
  .add('Compiled validator', () => {
    compiled(data);
  });

await bench.run();

console.table(bench.table());
