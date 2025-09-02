import React from "react";
import { Star } from "lucide-react";

interface TestimonialCardProps {
  testimonial: {
    name: string;
    university: string;
    avatar: string;
    text: string;
    rating: number;
  };
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial }) => (
  <div className="rounded-2xl border border-border bg-card/50 p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg sm:p-8">
    {/* Header with Avatar, Name, and Rating */}
    <div className="mb-4 flex items-center space-x-3 sm:mb-6 sm:space-x-4">
      {/* Avatar */}
      <div className="text-2xl sm:text-3xl">{testimonial.avatar}</div>

      {/* Name and University */}
      <div className="flex-1">
        <h4 className="text-sm font-bold text-card-foreground sm:text-base">
          {testimonial.name}
        </h4>
        <p className="text-xs text-muted-foreground sm:text-sm">
          {testimonial.university}
        </p>
      </div>

      {/* Star Rating */}
      <div className="flex space-x-1">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star
            key={i}
            className="h-3 w-3 fill-primary text-primary sm:h-4 sm:w-4"
          />
        ))}
      </div>
    </div>

    {/* Testimonial Text */}
    <p className="text-sm italic leading-relaxed text-muted-foreground sm:text-base">
      &quot;{testimonial.text}&quot;
    </p>
  </div>
);

export default TestimonialCard;
