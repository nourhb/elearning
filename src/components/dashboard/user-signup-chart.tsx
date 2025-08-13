
'use client';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { UserProfile } from '@/lib/types';
import { format, subMonths } from 'date-fns';
import { useTranslation } from 'react-i18next';
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";


interface UserSignupChartProps {
  users: UserProfile[];
}

export function UserSignupChart({ users }: UserSignupChartProps) {
  const { t } = useTranslation();

  const processData = () => {
    const now = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => subMonths(now, 5 - i));

    const monthlySignups = last6Months.map(monthDate => {
        const monthName = format(monthDate, 'MMM');
        return { name: monthName, total: 0 };
    });

    users.forEach(user => {
        const signupDate = user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt);
        const monthName = format(signupDate, 'MMM');
        const year = signupDate.getFullYear();
        
        const targetMonth = monthlySignups.find(m => m.name === monthName);

        if (targetMonth && signupDate.getFullYear() === now.getFullYear()) {
            targetMonth.total += 1;
        }
    });

    return monthlySignups;
  };
  
  const chartData = processData();
  
  const chartConfig = {
    total: {
      label: t('newUsers'),
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          stroke="#888888"
          fontSize={12}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
