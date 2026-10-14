import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
// shadcn-style owned component, using Skylit's existing palette and touch sizes.
export const buttonVariants = cva("ui-button", {
  variants: {
    variant: {
      default: "primary",
      secondary: "secondary",
      ghost: "quiet",
      outline: "secondary",
      destructive: "ui-destructive",
      unstyled: "",
    },
  },
  defaultVariants: { variant: "default" },
});
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, asChild = false, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={type}
        className={clsx(buttonVariants({ variant }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
// Compatibility boundary for custom surfaces and canonical legacy forms. Unlike an
// action Button, omitting type retains the native form-submit default.
export const NativeButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button ref={ref} className={clsx("ui-button", className)} {...props} />
));
NativeButton.displayName = "NativeButton";
