export async function generateStaticParams() {
  return [
    { id: 'default' }
  ];
}

export default function CourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
