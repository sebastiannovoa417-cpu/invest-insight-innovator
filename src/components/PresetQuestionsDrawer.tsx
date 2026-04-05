import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface QuestionSection {
  id: string;
  label: string;
  questions: string[];
}

interface PresetQuestionsDrawerProps {
  sections: QuestionSection[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (question: string) => void;
}

export function PresetQuestionsDrawer({
  sections,
  open,
  onOpenChange,
  onSelect,
}: PresetQuestionsDrawerProps) {
  const handleSelect = (question: string) => {
    onSelect(question);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[70vh] overflow-y-auto rounded-t-xl border-border bg-card px-4 pb-6 pt-4"
      >
        <SheetHeader className="mb-3">
          <SheetTitle className="text-sm font-semibold text-foreground">
            Suggested Questions
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Tap a question to populate the input.
          </SheetDescription>
        </SheetHeader>

        <Accordion type="single" collapsible className="space-y-0">
          {sections.map((section) => (
            <AccordionItem
              key={section.id}
              value={section.id}
              className="border-border"
            >
              <AccordionTrigger className="py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground hover:no-underline">
                {section.label}
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-1 pb-1">
                  {section.questions.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSelect(q)}
                      className="w-full text-left px-3 py-1.5 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </SheetContent>
    </Sheet>
  );
}
