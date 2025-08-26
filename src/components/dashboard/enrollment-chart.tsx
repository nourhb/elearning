
'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Course } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface EnrollmentChartProps {
  courses?: Course[];
}

export function EnrollmentChart({ courses = [] }: EnrollmentChartProps) {
  const { t } = useTranslation();

  // Add null check for courses
  if (!courses || courses.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No course data available
      </div>
    );
  }

  const chartData = courses.map(course => ({
    name: course.title.length > 20 ? `${course.title.substring(0, 20)}...` : course.title,
    students: course.studentCount || 0,
  }));

  const chartConfig = {
    students: {
      label: t('students'),
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis />
        <Tooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar dataKey="students" fill="var(--color-students)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
