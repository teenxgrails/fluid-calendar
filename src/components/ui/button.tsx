import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "liquid-press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "liquid-shimmer border border-white/15 bg-[linear-gradient(135deg,var(--acc-blue),var(--acc-violet)_55%,var(--acc-magenta))] text-white shadow-[0_0_32px_-14px_var(--acc-violet)] hover:brightness-110",
        destructive:
          "border border-red-300/20 bg-red-500/20 text-red-100 shadow-sm hover:bg-red-500/30",
        outline:
          "border border-white/12 bg-white/[0.045] text-foreground shadow-sm backdrop-blur-xl hover:border-white/20 hover:bg-white/[0.075]",
        secondary:
          "border border-white/10 bg-white/[0.07] text-secondary-foreground shadow-sm backdrop-blur-xl hover:bg-white/[0.105]",
        ghost: "hover:bg-white/[0.07] hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-xl px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
