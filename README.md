# jsonSchemaValidator

Lightweight and extensible JSON Schema validator for Node.js and modern JavaScript environments.

## Medium Data

| Validator | Dataset | Avg Latency (ns) | Median Latency (ns) | Throughput Avg (ops/s) | Median Throughput (ops/s) | Samples |
|-----------|---------|-----------------|--------------------|-----------------------|--------------------------|---------|
| Native Validator | dataset-10 | 156,692 ± 2.68% | 147,600 ± 3,400 | 6,798 ± 2.33% | 6,775 ± 160 | 639 |
| Compiled Validator | dataset-10 | 5,702.3 ± 0.46% | 5,600 ± 100 | 180,758 ± 0.26% | 178,571 ± 3,133 | 17,537 |
| AJV | dataset-10 | 6,202 ± 1.64% | 6,300 ± 100 | 175,662 ± 0.56% | 158,730 ± 2,480 | 16,124 |
| Native Validator | dataset-100 | 1,519,285 ± 7.95% | 1,599,950 ± 245,450 | 758 ± 11.24% | 625 ± 87 | 66 |
| Compiled Validator | dataset-100 | 56,164 ± 1.62% | 58,800 ± 700 | 20,767 ± 2.40% | 17,007 ± 205 | 1,781 |
| AJV | dataset-100 | 66,291 ± 0.83% | 66,600 ± 1,000 | 15,655 ± 1.30% | 15,015 ± 222 | 1,509 |
| Native Validator | dataset-1000 | 18,400,058 ± 2.18% | 18,482,150 ± 1,189,550 | 55 ± 2.24% | 54 ± 3 | 64 |
| Compiled Validator | dataset-1000 | 763,718 ± 6.18% | 656,800 ± 14,600 | 1,454 ± 5.39% | 1,523 ± 35 | 131 |
| AJV | dataset-1000 | 911,730 ± 6.73% | 754,700 ± 77,700 | 1,231 ± 6.21% | 1,325 ± 144 | 111 |
| Native Validator | dataset-100000 | 1,808,855,714 ± 10.22% | 1,934,364,000 ± 252,577,850 | 1 ± 15.66% | 1 ± 0 | 64 |
| Compiled Validator | dataset-100000 | 68,487,750 ± 6.33% | 65,293,250 ± 10,095,800 | 15 ± 6.05% | 15 ± 2 | 64 |
| AJV | dataset-100000 | 54,754,292 ± 5.12% | 54,808,850 ± 9,076,600 | 19 ± 5.15% | 18 ± 3 | 64 |