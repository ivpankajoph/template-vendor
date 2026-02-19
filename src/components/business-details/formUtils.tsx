import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React from "react";

type RenderTextInputProps = {
  name: string;
  label: string;
  icon?: React.ReactNode;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onPaste?: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  error?: string;
  className?: string;
};

export const renderTextInput = ({
  name,
  label,
  icon,
  placeholder,
  value,
  onChange,
  onBlur,
  onPaste,
  error,
  className = "",
}: RenderTextInputProps) => (
  <div className="flex flex-col">
    <label className="mb-1 font-semibold text-sm">{label}</label>
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
      )}
      <Input
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onPaste={onPaste}
        placeholder={placeholder || label}
        className={`${icon ? "pl-10" : ""} ${className}`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  </div>
);

type RenderSelectProps = {
  name: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  error?: string;
};

export const renderSelect = ({
  name,
  label,
  value,
  onValueChange,
  options,
  error,
}: RenderSelectProps) => (
  <div className="flex flex-col">
    <label className="mb-1 font-semibold text-sm">{label}</label>
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder={`Select ${label}`} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

type RenderFileInputProps = {
  name: string;
  label: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
};

export const renderFileInput = ({
  name,
  label,
  onChange,
  error,
}: RenderFileInputProps) => (
  <div className="flex flex-col">
    <label className="font-semibold mb-1">{label}</label>
    <Input type="file" name={name} accept=".pdf" onChange={onChange} />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);