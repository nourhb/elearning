
'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import type { UserProfile } from '@/lib/types';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

interface UserRolesChartProps {
  users: UserProfile[];
}

const COLORS = {
  admin: 'hsl(var(--chart-1))',
  formateur: 'hsl(var(--chart-2))',
  student: 'hsl(var(--chart-3))',
};

export function UserRolesChart({ users }: UserRolesChartProps) {
  const { t } = useTranslation();
  
  const roleCounts = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<UserProfile['role'], number>);

  const chartData = Object.entries(roleCounts).map(([name, value]) => ({
    name: t(name),
    value,
    fill: COLORS[name as UserProfile['role']],
  }));

   const chartConfig = {
    value: {
      label: t('users'),
    },
    admin: {
      label: t('admin'),
      color: 'hsl(var(--chart-1))',
    },
    formateur: {
      label: t('formateur'),
      color: 'hsl(var(--chart-2))',
    },
    student: {
      label: t('student'),
      color: 'hsl(var(--chart-3))',
    },
  };


  return (
     <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square max-h-[250px]"
    >
      <PieChart>
        <Tooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={60}
          strokeWidth={5}
        >
           {chartData.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={entry.fill} />
            ))}
        </Pie>
         <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="-translate-y-[2rem] flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
        />
      </PieChart>
    </ChartContainer>
  );
}
