"use client";

import React from "react";
import { ArrowRight, BookOpen, Play, Flame, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const Hero = () => {
  return (
    <section className="min-h-screen sm:pt-4 md:pt-12 w-full bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          {/* Left Column: Content */}
          <div className="flex flex-col justify-center space-y-8">
            {/* Headline */}
            <div className="text-center lg:text-left">
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
                Study Smarter, Together
              </h1>
            </div>

            {/* Description */}
            <div className="text-center lg:text-left">
              <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-lg lg:mx-0 lg:max-w-lg">
                Pomigo is the social Pomodoro app where you and your friends
                stay accountable, track progress, and crush your study goals.
              </p>
            </div>

            {/* Call-to-action Buttons */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
              <Button
                size="lg"
                className="w-full sm:w-auto px-6 py-3 text-sm sm:text-base sm:px-8 sm:py-4"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-6 py-3 text-sm sm:text-base sm:px-8 sm:py-4"
              >
                See How It Works
              </Button>
            </div>

            {/* Social Proof Section */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 lg:justify-start lg:gap-12">
              <div className="text-center lg:text-left">
                <p className="text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
                  10K+
                </p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Students
                </p>
              </div>
              <div className="text-center lg:text-left">
                <p className="text-2xl font-bold text-foreground sm:text-3xl lg:text-4xl">
                  1M+
                </p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Study Hours
                </p>
              </div>
              <div className="text-center lg:text-left">
                <p className="flex items-center justify-center text-2xl font-bold text-foreground sm:text-3xl lg:justify-start lg:text-4xl">
                  4.9
                  <Star className="ml-1 h-5 w-5 fill-current text-primary sm:h-6 sm:w-6" />
                </p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Rating
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: App Mockup */}
          <div className="flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-[18rem] sm:max-w-sm md:max-w-md">
              <Card className="overflow-hidden rounded-2xl border shadow-lg sm:rounded-3xl">
                <CardContent className="p-6 sm:p-8">
                  {/* Timer Section */}
                  <div className="text-center">
                    <p className="mb-4 text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tighter text-foreground">
                      25:00
                    </p>
                    <div className="mb-6 flex justify-center">
                      <Badge
                        variant="secondary"
                        className="inline-flex items-center space-x-2 px-3 py-1"
                      >
                        <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs font-medium sm:text-sm">
                          Mathematics
                        </span>
                      </Badge>
                    </div>
                    <Button
                      size="lg"
                      className="w-full rounded-full text-sm sm:text-base"
                    >
                      <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Start Focus
                    </Button>
                  </div>

                  <Separator className="my-6 sm:my-8" />

                  {/* Friends Section */}
                  <div className="text-left">
                    <h4 className="mb-4 text-xs font-semibold text-foreground sm:text-sm">
                      Friends Studying Now
                    </h4>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex items-center">
                        <span className="text-lg sm:text-xl">👩‍💻</span>
                        <p className="ml-3 flex-1 text-xs sm:text-sm text-muted-foreground sm:ml-4">
                          Sarah is studying Physics
                        </p>
                        <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                      </div>
                      <div className="flex items-center">
                        <span className="text-lg sm:text-xl">👨‍🎓</span>
                        <p className="ml-3 flex-1 text-xs sm:text-sm text-muted-foreground sm:ml-4">
                          Alex completed 4 sessions
                        </p>
                        <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
