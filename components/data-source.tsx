import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";

interface Source {
  pageContent: string[];
  metadata: {
    pageNumber?: number;
    [key: string]: any; // Extendable for future metadata fields
  };
}

interface DataSourceCardProps {
  sources: Source[];
  triggerSearch: (content: string[]) => void;
}

export function DataSourceCard({
  sources,
  triggerSearch,
}: DataSourceCardProps) {
  // Helper function to truncate content
  const truncateContent = (content: string, wordLimit: number): string => {
    const words = content.split(" ");
    return words.length > wordLimit
      ? words.slice(0, wordLimit).join(" ") + "..."
      : content;
  };

  return (
    <Card className="p-4 mt-5">
      <h2 className="text-lg font-semibold mb-4">Source</h2>
      {sources.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No sources available.
        </p>
      ) : (
        <ScrollArea className="h-[250px]">
          {sources.map((source, index) => (
            <div
              key={index}
              className="p-3 rounded-lg mb-2 transition-colors hover:bg-primary/5 cursor-pointer"
              onClick={() => triggerSearch(source.pageContent)}
            >
              <div className="text-sm text-muted-foreground mb-1">
                Page {source.metadata.pageNumber ?? "Unknown"}
              </div>
              <p className="text-sm">
                {truncateContent(source.pageContent.join(), 20)}
              </p>
            </div>
          ))}
        </ScrollArea>
      )}
    </Card>
  );
}
