export async function generateStaticParams() {
  return [
    { id: 'default' }
  ];
}

export default function CourseEditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
