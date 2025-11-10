import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Loader2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableFieldProps {
  value: string | number | null | undefined;
  onSave: (value: string | number | null) => Promise<void>;
  label?: string;
  type?: "text" | "number" | "tel";
  placeholder?: string;
  format?: (value: string | number | null | undefined) => string;
  parse?: (value: string) => string | number | null;
  className?: string;
  disabled?: boolean;
}

export function EditableField({
  value,
  onSave,
  label,
  type = "text",
  placeholder,
  format,
  parse,
  className,
  disabled = false,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const displayValue = format ? format(value) : (value?.toString() || "N/A");

  const handleStartEdit = () => {
    if (disabled) return;
    setEditValue(value?.toString() || "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue("");
  };

  const handleSave = async () => {
    if (isSaving) return; // Prevent double submission
    
    setIsSaving(true);
    try {
      const parsedValue = parse ? parse(editValue) : editValue;
      await onSave(parsedValue as string | number | null);
      setIsEditing(false);
      setEditValue("");
    } catch (error) {
      console.error("Error saving field:", error);
      // Don't close the editor on error - let user see the error and retry
      // The error will be shown via toast in the parent component
      // Re-throw so parent can handle it
      throw error;
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSaveClick = () => {
    handleSave().catch((error) => {
      // Error is already logged and will be handled by parent's toast
      // This catch prevents unhandled promise rejection
    });
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Input
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder={placeholder}
          className="h-8"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSaveClick();
            } else if (e.key === "Escape") {
              handleCancel();
            }
          }}
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleSaveClick}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4 text-green-600" />
          )}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleCancel}
          disabled={isSaving}
        >
          <X className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("group relative space-y-1", className)}>
      {label && (
        <p className="text-xs text-muted-foreground">{label}</p>
      )}
      <div className="flex items-center gap-2">
        <span className={cn(label ? "text-base font-semibold" : "text-sm")}>
          {displayValue}
        </span>
        {!disabled && (
          <button
            type="button"
            onClick={handleStartEdit}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
            title="Edit"
          >
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}

