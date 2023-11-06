import { z, defineCollection } from "astro:content";

const selectionEnum = z.enum(["A", "B", "C", "D"]);

const quizzesCollection = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    level: z.enum(["A1", "A2", "B1", "B2", "B3", "C1", "C2"]),
    questions: z.array(
      z.object({
        text: z.string(),
        answer: selectionEnum,
        answers: z.array(
          z.object({
            value: selectionEnum,
            text: z.string(),
          }),
        ),
      }),
    ),
  }),
});

export const collections = {
  quiz: quizzesCollection,
};
