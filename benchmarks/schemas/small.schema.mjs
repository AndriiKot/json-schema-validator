export const userCodeChallengesSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',

  type: 'object',
  additionalProperties: false,

  required: ['totalPages', 'totalItems', 'data'],

  properties: {
    totalPages: {
      type: 'integer',
      minimum: 0,
    },

    totalItems: {
      type: 'integer',
      minimum: 0,
    },

    data: {
      type: 'array',
      minItems: 0,

      items: {
        type: 'object',
        additionalProperties: false,

        required: [
          'id',
          'name',
          'slug',
          'completedLanguages',
          'completedAt',
        ],

        properties: {
          id: {
            type: 'string',
            minLength: 1,
          },

          name: {
            type: 'string',
            minLength: 1,
          },

          slug: {
            type: 'string',
            minLength: 1,
          },

          completedLanguages: {
            type: 'array',
            minItems: 0,

            items: {
              type: 'string',
              minLength: 1,
            },
          },

          completedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
  },
};
