import { Quote } from "lucide-react";
import { testimonialContent, type Testimonial } from "@/src/content/testimonials";

export default function TestimonialCard({
  item,
  compact = false,
}: {
  item: Testimonial;
  compact?: boolean;
}) {
  return (
    <figure className="flex h-full min-h-44 flex-col rounded-2xl border border-black/5 bg-white p-5 text-[#171914] shadow-[0_8px_28px_#00000008]">
      <Quote
        size={20}
        strokeWidth={1.4}
        className="mb-3 text-[#2d416f]"
        aria-hidden="true"
      />
      <blockquote
        className={
          "break-words text-sm leading-6 " +
          (compact ? "line-clamp-4" : "whitespace-pre-wrap")
        }
      >
        {item.text}
      </blockquote>
      <figcaption className="mt-auto pt-5">
        <p className="break-words text-xs font-medium">{item.author}</p>
        {item.instagram && (
          <p className="mt-1 break-all text-xs text-neutral-500">@{item.instagram}</p>
        )}
        {item.example && (
          <p className="mt-1 text-[10px] text-neutral-500">
            {testimonialContent.example}
          </p>
        )}
      </figcaption>
    </figure>
  );
}
