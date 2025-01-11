import { Course, Flashcard, PrismaClient } from "@prisma/client";
import { inngest } from "./client";
import { generateFlashcards } from "./generate-flash-card";

const prisma = new PrismaClient();

export const triggerFlashcards = inngest.createFunction(
  { id: "generate-flashcards" },
  { event: "course/generate.flashcards" },
  async ({ event, step }) => {
    const { courseId } = event.data;

    const course = await step.run("fetch-course", async () => {
      return await prisma.course.findUnique({
        where: { id: courseId },
        include: { chapters: true },
      });
    });

    if (!course) {
      throw new Error(`Course not found with ID: ${courseId}`);
    }

    const data = {
      ...course,
      createdAt: new Date(course?.createdAt.toString() ?? ""),
      updatedAt: new Date(course?.updatedAt?.toString() ?? ""),
    };

    const result = await generateFlashcards(data as Course);

    try {
      const flashcardsData = result.map((result: Flashcard) => ({
        title: result.title,
        content: result.content,
        courseId: course?.id as string,
      }));

      await prisma.flashcard.createMany({
        data: flashcardsData,
      });
    } catch (error) {
      console.error("Error inserting flashcards:", error);
    }

    return { courseId, status: "completed", result };
  },
);

export const generateVideoRecommendations = inngest.createFunction(
  { id: "generate-video-recommendations" },
  { event: "video/generate.recommendations" },
  async ({ event }) => {
    const { courseId, chapterId } = event.data;
    return { status: "completed", data: { courseId, chapterId } };
  },
);
