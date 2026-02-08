export const StyledTextarea = (
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) => (
  <textarea
    {...props}
    className="w-full min-h-[100px] rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#0c493e] focus:outline-none focus:ring-1 focus:ring-[#0c493e]"
  />
);
