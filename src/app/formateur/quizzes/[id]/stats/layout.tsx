export async function generateStaticParams() {
  return [
    { id: 'default' }
  ];
}

export default function QuizStatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
