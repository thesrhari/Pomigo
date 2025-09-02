import React from "react";
import TestimonialCard from "../TestimonialCard";

const testimonials = [
  {
    name: "Sarah Chen",
    university: "MIT",
    avatar: "👩‍💻",
    text: "Pomigo helped me study 40% more efficiently. The social aspect keeps me accountable!",
    rating: 5,
  },
  {
    name: "Marcus Rodriguez",
    university: "Stanford",
    avatar: "👨‍🎓",
    text: "Finally found a Pomodoro app that makes studying social and fun. Love the friend features!",
    rating: 5,
  },
  {
    name: "Emma Wilson",
    university: "Harvard",
    avatar: "👩‍🔬",
    text: "The analytics helped me understand my study patterns. My grades improved significantly!",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  return (
    <section className="w-full bg-background py-16 sm:py-20 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto mb-12 max-w-4xl text-center sm:mb-16">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:mb-6 sm:text-4xl lg:text-5xl">
            Stop studying alone. Stay accountable with friends.
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg lg:text-xl">
            Join thousands of students who&apos;ve transformed their study
            habits with social accountability.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
