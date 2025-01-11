"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { getCourse } from "@/features/course/actions/get-course";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  BarChart,
  BookOpen,
  CheckCircle,
  ChevronDown,
  Clock,
  Edit,
  Loader2,
  Share2,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { errorToast, successToast } from "../global/toast";
import { useRouter } from "next/navigation";

const generateFlashcards = async (courseId: string) => {
  const response = await fetch(`/api/inngest/flash-card?courseId=${courseId}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error("Failed to generate flashcards");
  }
  return response.json();
};

const generateVideo = async (courseId: string, chapterId: string) => {
  const response = await fetch(
    `/api/inngest/video?courseId=${courseId}&chapterId=${chapterId}`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to generate flashcards");
  }
  return response.json();
};

type Props = {
  id: string;
};

export function CoursePage({ id }: Props) {
  const [openChapters, setOpenChapters] = useState<string[]>([]);
  const router = useRouter();

  const {
    data: course,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["course-data", id],
    queryFn: () => getCourse(id),
  });

  const toggleChapter = (chapterId: string) => {
    setOpenChapters((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId],
    );
  };

  const { mutate: generate, isPending: isGenerating } = useMutation({
    mutationKey: ["generate-flashcards"],
    mutationFn: generateFlashcards,
    onSuccess: () => {
      successToast("Flashcards generated successfully");
    },
    onError: (error: Error) => {
      errorToast(error.message);
    },
  });

  const { mutate: generateVideoMutate, isPending: isGeneratingVideo } =
    useMutation({
      mutationKey: ["generate-video"],
      mutationFn: (data: { courseId: string; chapterId: string }) =>
        generateVideo(data.courseId, data.chapterId),
      onSuccess: () => {
        successToast("Video generated successfully");
      },
      onError: (error: Error) => {
        errorToast(error.message);
      },
    });

  const completedChapters =
    course?.chapters?.filter((chapter) => chapter.completed).length || 0;
  const totalChapters = course?.chapters?.length || 0;
  const progressPercentage = (completedChapters / totalChapters) * 100;

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Failed to load course</p>
        </CardContent>
      </Card>
    );
  }

  if (!course) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Course not found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto space-y-8">
      <Card className="relative overflow-hidden">
        <CardHeader className="pt-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold">
                {course.name}
              </CardTitle>
              <CardDescription className="text-base">
                {course.description}
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant="secondary" className="px-4 py-1">
                {course.type}
              </Badge>
              <Badge
                variant="outline"
                className={`px-4 py-1 ${
                  course.level === "Easy"
                    ? "border-green-500 text-green-500"
                    : course.level === "Moderate"
                      ? "border-yellow-500 text-yellow-500"
                      : "border-red-500 text-red-500"
                }`}
              >
                {course.level}
              </Badge>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-6">
            {course.duration && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {course.duration}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {course.topic}
              </span>
            </div>
            {course.category && (
              <div className="flex items-center gap-2">
                <BarChart className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {course.category}
                </span>
              </div>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardFooter className="border-t bg-muted/50 pt-6">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm">
                Progress: {completedChapters}/{totalChapters} chapters
              </div>
              <Progress value={progressPercentage} className="w-32" />
            </div>
            <Badge variant="secondary">
              {progressPercentage === 100 ? "Completed" : "In Progress"}
            </Badge>
          </div>
        </CardFooter>
      </Card>

      <Card className="border-none px-0 shadow-none">
        <CardHeader className="px-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Flash Cards</h3>

            <Button asChild variant="outline">
              <Link href={`/course/${course.id}/card`}>View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="flex max-w-sm flex-col">
            <div className="flex flex-col items-start justify-start">
              <h3 className="text-lg font-semibold">Flashcards</h3>
              <Button
                size="sm"
                onClick={() => generate(course.id)}
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate"}
              </Button>
            </div>
          </div>
        </CardContent>

        <CardContent className="px-0 pt-6">
          {course.flashcards.length > 0 ? (
            <div className="space-y-4">
              <Accordion type="single" collapsible>
                {course.flashcards.map((flashcard) => (
                  <AccordionItem value={flashcard.id} key={flashcard.id}>
                    <AccordionTrigger>{flashcard.title}</AccordionTrigger>
                    <AccordionContent>{flashcard.content}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ) : (
            <div className="text-muted-foreground">
              No flashcards found for this course.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none px-0 shadow-none">
        <CardHeader className="px-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Chapters</CardTitle>
              <CardDescription>Course content and structure</CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                setOpenChapters(
                  openChapters.length === course.chapters.length
                    ? []
                    : course.chapters.map((c) => c.id),
                )
              }
            >
              {openChapters.length === course.chapters.length
                ? "Collapse All"
                : "Expand All"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="space-y-4">
            {course.chapters.map((chapter, index) => (
              <Collapsible
                key={chapter.id}
                open={openChapters.includes(chapter.id)}
                onOpenChange={() => toggleChapter(chapter.id)}
                className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {index < completedChapters ? (
                      <CheckCircle className="mt-1 h-5 w-5 flex-shrink-0 text-green-500" />
                    ) : (
                      <XCircle className="mt-1 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    )}
                    <div>
                      <CollapsibleTrigger className="flex items-center gap-2 transition-colors hover:text-primary">
                        <h3 className="text-lg font-semibold">
                          {chapter.orderIndex}. {chapter.name}
                        </h3>
                        <ChevronDown className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {chapter.duration}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {chapter.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {chapter.topic}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      chapter.level === "Easy"
                        ? "border-green-500 text-green-500"
                        : chapter.level === "Moderate"
                          ? "border-yellow-500 text-yellow-500"
                          : "border-red-500 text-red-500"
                    }
                  >
                    {chapter.level}
                  </Badge>
                </div>
                <CollapsibleContent className="mt-4">
                  <div className="pl-9">
                    <p className="text-sm text-muted-foreground">
                      {chapter.description}
                    </p>
                    <div className="mt-4">
                      <Button
                        size="sm"
                        onClick={() => {
                          router.push(
                            `/course/${course.id}/chapter/${chapter.id}`,
                          );
                          generateVideoMutate({
                            chapterId: chapter.id,
                            courseId: course.id,
                          });
                        }}
                        disabled={isGeneratingVideo}
                      >
                        {isGeneratingVideo ? "Generating..." : "Start Chapter"}
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
