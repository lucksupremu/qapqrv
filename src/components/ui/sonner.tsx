import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-center"
      duration={3000}
      visibleToasts={1}
      richColors
      className="toaster group"
      {...props}
    />
  );
};

export { Toaster };
