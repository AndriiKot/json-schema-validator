import { generateDataset } from '#benchmarks';
import { userProfileTemplate } from '#benchmarks';


export const dataset100000 = generateDataset(
  100000,
  userProfileTemplate,
  (user, i) => {
    user.id = `65414e312c58d11519d2aa${i}`;
    user.username = `user${i}`;
    user.leaderboardPosition += i;
  },
);

