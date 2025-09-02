// components/PersonaCard.tsx

import { Card } from "@/components/ui/card";

type PersonaCardProps = {
  title: string;
  description: string;
  icon: React.ElementType;
};

export const PersonaCard = ({
  title,
  description,
  icon: Icon,
}: PersonaCardProps) => (
  // REMOVED `h-full` from this className
  <Card className="flex flex-col justify-center items-center text-center p-6">
    <Icon className="w-10 h-10 text-muted-foreground my-4" />
    <p className="text-xl font-bold">{title}</p>
    <p className="text-sm text-muted-foreground mt-1">{description}</p>
  </Card>
);
