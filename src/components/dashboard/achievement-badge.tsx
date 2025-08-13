
import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type AchievementBadgeProps = {
  icon: LucideIcon;
  name: string;
  delay?: number;
};

function AchievementBadgeComponent({ icon: Icon, name, delay = 0 }: AchievementBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className="group relative flex h-20 w-20 cursor-pointer items-center justify-center rounded-full bg-accent"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, type: "spring", stiffness: 300, damping: 20 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Icon className="h-10 w-10 text-primary transition-colors group-hover:text-primary/80" />
          </motion.div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const AchievementBadge = React.memo(AchievementBadgeComponent);

    