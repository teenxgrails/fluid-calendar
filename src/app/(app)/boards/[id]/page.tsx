import { BoardCanvas } from "@/components/boards/BoardCanvas";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="h-full">
      <BoardCanvas boardId={id} />
    </div>
  );
}
