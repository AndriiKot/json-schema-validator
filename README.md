
# JSON Schema Validator

High-performance JSON schema validator for Node.js.

Designed for:

- ⚡ maximum performance
- 🧠 smart compiled validators
- 🔧 extensibility
- 📦 minimal overhead

---

# Why another validator?

Most validators focus on flexibility but sacrifice performance.

This project focuses on **raw validation speed** while still supporting:

- runtime validation
- compiled validators
- custom types
- custom validators

---

# Installation

```bash
npm install json-schema-validator
````

---

# Quick Example

```js
import { Validator } from "json-schema-validator";

const validator = new Validator();

const schema = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" }
  }
};

const data = {
  name: "John",
  age: 30
};

const result = validator.validate(schema, data);

console.log(result);
```

---

# Two Validation Modes

## Runtime validation

Use when data is validated **only once**.

```js
validator.validate(schema, data);
```

Advantages:

* no compilation cost
* fastest for single validation

---

## Compiled validation

Use when validating **large datasets**.

```js
const validate = validator.compile(schema);

validate(data1);
validate(data2);
validate(data3);
```

Advantages:

* schema compiled once
* extremely fast repeated validation

---

# Performance

Benchmark executed using **tinybench**.

Libraries compared:

* Ajv
* Zod
* Yup
* Fastest Validator

Results:

| Validator         | ops/sec       | relative speed |
| ----------------- | ------------- | -------------- |
| **NativeEngine**  | **1,186,514** | 🥇 fastest     |
| CompiledValidator | 94,039        | 12× slower     |
| Yup               | 11,225        | 100× slower    |
| Zod               | 7,493         | 158× slower    |
| FastestValidator  | 3,796         | 312× slower    |
| AJV (cold start)  | 225           | 5270× slower   |

---

# Benchmark Chart

```

NativeEngine        █████████████████████████████████████████ 1,186,514
CompiledValidator   ████ 94,039
Yup                 █ 11,225
Zod                 █ 7,493
FastestValidator    ▌ 3,796
AJV cold            ▏ 225

```

---

# When to use which mode

| Scenario                   | Method        |
| -------------------------- | ------------- |
| single validation          | `.validate()` |
| large dataset              | `.compile()`  |
| high performance pipelines | `.compile()`  |

---

# Cache

Compiled schemas are automatically cached using `WeakMap`.

```js
const validator = new Validator();

const validate = validator.compile(schema);

// reused from cache
const validate2 = validator.compile(schema);
```

Clear cache:

```js
validator.clearCache();
```

---

# Options

```js
const validator = new Validator({
  recursive: true,
  strict: true,
  customTypes: {},
  customValidators: []
});
```

| option           | description                |
| ---------------- | -------------------------- |
| recursive        | validate nested structures |
| strict           | strict schema validation   |
| customTypes      | user defined types         |
| customValidators | custom validators          |

---

# Architecture

Validator uses two internal engines:

| Engine        | Description        |
| ------------- | ------------------ |
| NativeEngine  | runtime validation |
| CodeGenerator | compiled validator |

---

# Roadmap

* more JSON Schema features
* async validation
* schema precompilation
* browser support

---

# License

