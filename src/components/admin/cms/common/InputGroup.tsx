export const InputGroup = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-2">
    <label className="text-sm font-semibold text-gray-700">{label}</label>
    {children}
  </div>
);
