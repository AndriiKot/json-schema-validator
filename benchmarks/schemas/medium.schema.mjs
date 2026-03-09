export const userProfileSchema = {
  type: 'object',
  required: [
    'id',
    'username',
    'honor',
    'ranks',
    'codeChallenges',
    'leaderboardPosition',
  ],

  properties: {
    id: { type: 'string' },

    username: { type: 'string' },

    name: { type: 'string' },

    honor: {
      type: 'integer',
      minimum: 0,
    },

    clan: { type: 'string' },

    leaderboardPosition: {
      type: 'integer',
      minimum: 1,
    },

    skills: {
      type: 'array',
      items: { type: 'string' },
    },

    ranks: {
      type: 'object',
      required: ['overall', 'languages'],

      properties: {
        overall: {
          type: 'object',
          required: ['rank', 'name', 'color', 'score'],
          properties: {
            rank: {
              type: 'integer',
              minimum: -8,
              maximum: 8,
            },

            name: {
              type: 'string',
              enum: [
                '8 kyu', '7 kyu', '6 kyu', '5 kyu', '4 kyu', '3 kyu', '2 kyu', '1 kyu',
                '1 dan', '2 dan', '3 dan', '4 dan', '5 dan', '6 dan', '7 dan', '8 dan',
              ],
            },

            color: { type: 'string' },

            score: {
              type: 'integer',
              minimum: 0,
            },
          },
        },

        languages: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            required: ['rank', 'name', 'color', 'score'],
            properties: {
              rank: {
                type: 'integer',
                minimum: -8,
                maximum: 8,
              },

              name: {
                type: 'string',
                enum: [
                  '8 kyu', '7 kyu', '6 kyu', '5 kyu', '4 kyu', '3 kyu', '2 kyu', '1 kyu',
                  '1 dan', '2 dan', '3 dan', '4 dan', '5 dan', '6 dan', '7 dan', '8 dan',
                ],
              },

              color: { type: 'string' },

              score: {
                type: 'integer',
                minimum: 0,
              },
            },
          },
        },
      },
    },

    codeChallenges: {
      type: 'object',
      required: ['totalAuthored', 'totalCompleted'],

      properties: {
        totalAuthored: {
          type: 'integer',
          minimum: 0,
        },

        totalCompleted: {
          type: 'integer',
          minimum: 0,
        },
      },
    },
  },
}; 3;
