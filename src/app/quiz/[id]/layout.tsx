export async function generateStaticParams() {
  return [
    { id: 'default' }
  ];
}

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
