export const generateDataset = (size, template, mutate) => Array.from({ length: size }, (_, i) => {
    const item = structuredClone(template);

    if (mutate) {
      mutate(item, i);
    }

    return item;
  });
