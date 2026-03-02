import * as React from "react";
import { cn } from "./cn"; // adjust if your cn is located elsewhere

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, type = "button", ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type} // ✅ IMPORTANT: allows type="submit"
        className={cn(
          "inline-flex items-center justify-center gap-2",
          "transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          className
        )}
        {...props} // ✅ IMPORTANT: forwards disabled, onClick, etc
      />
    );
  }
);

Button.displayName = "Button";