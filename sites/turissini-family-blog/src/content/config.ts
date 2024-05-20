import { z, defineCollection } from 'astro:content';

const hikesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    image: z.object({
      src: z.string(),
      width: z.number(),
      height: z.number(),
      text: z.string(),
    }),
  }),
});

export const collections = {
  hikes: hikesCollection,
};
