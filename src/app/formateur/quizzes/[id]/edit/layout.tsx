export async function generateStaticParams() {
  return [
    { id: 'default' }
  ];
}

export default function QuizEditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
